#!/usr/bin/env bash
# Переводит кабель fox-pc ↔ мини-ПК на 192.168.50.0/30, не снимая шлюз Wi-Fi одним ifdown.
set -euo pipefail

fox_connection="${FOX_NM_CONNECTION:-pxe-minipc-eno1}"
interfaces_file="/etc/network/interfaces"
mini_cidr="192.168.50.2/30"
fox_cidr="192.168.50.1/30"
mini_ssh="mk@192.168.50.2"

usage() {
	printf 'usage: %s mini|fox\n' "$0" >&2
	exit 2
}

require_root() {
	if [[ "${EUID}" -ne 0 ]]; then
		echo "Нужен root." >&2
		exit 1
	fi
}

confirm_yes() {
	local answer
	if [[ ! -t 0 ]]; then
		echo "Нужен интерактивный терминал, чтобы подтвердить SSH." >&2
		exit 1
	fi
	read -r -p "$1" answer
	[[ "${answer}" == "yes" ]]
}

drop_default_via_eno1() {
	while ip -4 route show default dev eno1 | grep -q .; do
		ip route del default dev eno1
	done
}

require_wifi_path() {
	if ! ip -4 route show default dev wlp3s0 | grep -q .; then
		echo "Маршрут по умолчанию идёт не через wlp3s0. eno1 не трогаю." >&2
		exit 1
	fi
	ping -I wlp3s0 -c 3 -W 2 1.1.1.1
}

stop_eno1_dhcp() {
	local pidfile pid cmdline
	for pidfile in /run/dhclient.eno1.pid /run/dhcpcd/eno1.pid /run/dhcpcd.eno1.pid; do
		if [[ -f "${pidfile}" ]]; then
			pid="$(cat "${pidfile}")"
			kill "${pid}" || true
		fi
	done
	for pid in /proc/[0-9]*; do
		pid="${pid#/proc/}"
		[[ -r "/proc/${pid}/cmdline" ]] || continue
		cmdline="$(tr '\0' ' ' < "/proc/${pid}/cmdline" 2>/dev/null || true)"
		case "${cmdline}" in
			*"dhclient"*eno1*|*"dhcpcd"*eno1*) kill "${pid}" || true ;;
		esac
	done
}

remove_other_eno1_addrs() {
	local cidr
	while read -r cidr; do
		[[ -n "${cidr}" ]] || continue
		if [[ "${cidr}" == "${mini_cidr}" ]]; then
			continue
		fi
		ip addr del "${cidr}" dev eno1
	done < <(ip -4 -o addr show dev eno1 | awk '{print $4}')
}

strip_eno1_stanza() {
	awk '
		/^(auto|allow-hotplug)[[:space:]]+eno1([[:space:]]|$)/ { skip = 1; next }
		/^iface[[:space:]]+eno1[[:space:]]/ { skip = 1; next }
		skip && /^[[:space:]]/ { next }
		skip && /^$/ { next }
		skip { skip = 0 }
		{ print }
	' "$1"
}

write_eno1_static() {
	local tmp
	tmp="$(mktemp)"
	if [[ -f "${interfaces_file}" ]]; then
		strip_eno1_stanza "${interfaces_file}" > "${tmp}"
	fi
	if [[ -s "${tmp}" ]] && [[ "$(tail -c 1 "${tmp}")" != $'\n' ]]; then
		printf '\n' >> "${tmp}"
	fi
	cat >> "${tmp}" <<'EOF'
allow-hotplug eno1
iface eno1 inet static
    address 192.168.50.2/30
EOF
	install -m 644 "${tmp}" "${interfaces_file}"
	rm -f "${tmp}"
}

add_mini_addr() {
	if ! ip -4 -o addr show dev eno1 | awk '{print $4}' | grep -qx "${mini_cidr}"; then
		ip addr add "${mini_cidr}" dev eno1
	fi
	drop_default_via_eno1
}

mode_mini() {
	require_wifi_path
	/usr/sbin/iw dev wlp3s0 set power_save off
	add_mini_addr
	echo "На eno1 добавлен ${mini_cidr} рядом со старым адресом, шлюз на этот интерфейс не ставился."
	echo "С fox-pc откройте: ssh ${mini_ssh}"
	if ! confirm_yes "Введите yes, когда эта SSH-сессия жива: "; then
		echo "Подтверждения нет. Старый адрес eno1 оставлен." >&2
		exit 1
	fi
	stop_eno1_dhcp
	remove_other_eno1_addrs
	write_eno1_static
	drop_default_via_eno1
	echo "eno1 теперь только ${mini_cidr}. Дальше на fox-pc: $0 fox"
}

ssh_as_operator() {
	local ssh_user
	ssh_user="${SUDO_USER:-${USER}}"
	if [[ "${ssh_user}" == "root" ]]; then
		echo "Ключ кабеля лежит у mk. Запустите sudo из сессии mk." >&2
		return 1
	fi
	sudo -u "${ssh_user}" -- ssh -o BatchMode=yes -o ConnectTimeout=5 "${mini_ssh}" true
}

restore_fox_address() {
	local previous="$1"
	nmcli connection modify "${fox_connection}" \
		ipv4.method manual \
		ipv4.addresses "${previous}" \
		ipv4.gateway "" \
		ipv4.never-default yes
	nmcli connection up "${fox_connection}"
}

apply_fox_address() {
	nmcli connection modify "${fox_connection}" \
		ipv4.method manual \
		ipv4.addresses "${fox_cidr}" \
		ipv4.gateway "" \
		ipv4.never-default yes
	nmcli connection up "${fox_connection}"
	drop_default_via_eno1
}

mode_fox() {
	local previous attempt
	if ! nmcli -t -f NAME connection show | grep -qx "${fox_connection}"; then
		echo "Профиль NetworkManager ${fox_connection} не найден." >&2
		echo "Поднимите ${fox_cidr} на eno1 без шлюза, затем: ssh ${mini_ssh}" >&2
		exit 1
	fi
	previous="$(nmcli -g ipv4.addresses connection show "${fox_connection}")"
	previous="${previous%%$'\n'*}"
	if [[ -z "${previous}" ]]; then
		previous="192.168.50.1/24"
	fi
	apply_fox_address
	for attempt in 1 2 3 4 5 6; do
		if ssh_as_operator; then
			break
		fi
		if [[ "${attempt}" -eq 6 ]]; then
			echo "SSH на ${mini_ssh} не открылся. Возвращаю прежний адрес и не останавливаю DHCP." >&2
			restore_fox_address "${previous}"
			exit 1
		fi
		sleep 2
	done
	drop_default_via_eno1
	cat <<EOF
SSH на ${mini_ssh} жив. DHCP fox-pc на кабеле больше не оставляют включённым.
В репозитории pxe-minipc выполните:
  sudo scripts/pxe.sh stop
Если на eno1 появился маршрут по умолчанию, он снят. Шлюз мини-ПК остаётся только на Wi-Fi.
EOF
}

main() {
	require_root
	if [[ "$#" -ne 1 ]]; then
		usage
	fi
	case "$1" in
		mini) mode_mini ;;
		fox) mode_fox ;;
		*) usage ;;
	esac
}

main "$@"
