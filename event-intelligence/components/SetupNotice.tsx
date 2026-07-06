import { t, type Locale } from "@/lib/i18n";

export function SetupNotice({ locale = "en" }: { locale?: Locale }) {
  const copy = t(locale);
  return (
    <div className="rounded border border-yellow-200 bg-yellow-50 p-5 text-sm leading-6 text-yellow-950">
      <h2 className="text-base font-semibold text-yellow-950">{copy.setupTitle}</h2>
      <p className="mt-2">
        {copy.setupDescription} {copy.setupAction}
      </p>
    </div>
  );
}
