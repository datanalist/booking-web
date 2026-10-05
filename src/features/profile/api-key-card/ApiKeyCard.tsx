import type { ReactElement } from "react";
import { ApiKeyField } from "./ApiKeyField";
import { ApiKeyStatusLine } from "./ApiKeyStatusLine";
import type { ApiKeyStatus } from "./ApiKeyStatus";
import { ConnectButton } from "./ConnectButton";

export type ApiKeyCardProps = {
  status: ApiKeyStatus;
  apiKey: string;
  onApiKeyChange: (value: string) => void;
  onConnect: () => void;
};

export function ApiKeyCard({
  status,
  apiKey,
  onApiKeyChange,
  onConnect,
}: ApiKeyCardProps): ReactElement {
  return (
    <section className="box-border flex h-[244px] w-full min-w-0 flex-1 flex-col items-start justify-between rounded-xl bg-white p-5 font-sans outline outline-1 outline-offset-[-1px] outline-[rgba(251,192,40,0.17)]">
      <div className="flex flex-col items-start gap-[10px]">
        <p className="m-0 text-[18px] font-bold leading-[25px] tracking-[0.018px] text-[#1a1b1d]">
          API Key TravelLine
        </p>
        <ApiKeyStatusLine status={status} />
      </div>
      <ApiKeyField value={apiKey} onChange={onApiKeyChange} />
      <ConnectButton onClick={onConnect} />
    </section>
  );
}
