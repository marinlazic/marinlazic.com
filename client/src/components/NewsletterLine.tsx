// One line that points to the Tuesday newsletter on Substack. It sits at the
// end of the assessment report and under the guide form once the guide is sent.
import { substackSubscribeUrl } from "@/data/mediaData";
import { useAnalytics } from "@/hooks/useAnalytics";

export function NewsletterLine({ placement, className = "" }: { placement: string; className?: string }) {
  const { track } = useAnalytics();
  return (
    <p className={`text-[15px] leading-relaxed text-body ${className}`}>
      Get one short piece every Tuesday on training, recovery and sleep.{" "}
      <a
        href={substackSubscribeUrl(placement)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track("cta_click", { button: `newsletter_${placement}` })}
        className="font-medium text-ink underline underline-offset-2"
      >
        Subscribe on Substack
      </a>
      .
    </p>
  );
}
