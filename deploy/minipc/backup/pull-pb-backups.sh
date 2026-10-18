#!/usr/bin/env bash
# Забирает ZIP из /opt/pocketbase/pb_data/backups. Живые data.db и WAL не копирует.
set -euo pipefail

src="${PB_BACKUP_SRC:-mk@192.168.50.2:/opt/pocketbase/pb_data/backups/}"
dest="${PB_BACKUP_DEST:-${HOME}/Backups/pocketbase-minipc}"
keep=14
max_age_days=30

mkdir -p "${dest}"
rsync -az -e "ssh -o BatchMode=yes -o ConnectTimeout=20" \
	--include='*.zip' --exclude='*' \
	"${src}" "${dest}/"

find "${dest}" -maxdepth 1 -type f -name '*.zip' -mtime "+${max_age_days}" -delete

find "${dest}" -maxdepth 1 -type f -name '*.zip' -printf '%T@\t%p\n' \
	| sort -nr \
	| awk -F '\t' -v keep="${keep}" 'NR > keep { print $2 }' \
	| while IFS= read -r old; do
		rm -f -- "${old}"
	done
