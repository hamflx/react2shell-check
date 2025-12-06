<CVE-2025-55182>

React2Shell (CVE-2025-55182)
============================

What?
-----

A 10.0 critical severity vulnerablility affecting server-side use of React.js, tracked as [CVE-2025-55182](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components) in React.js and [CVE-2025-66478](https://github.com/vercel/next.js/security/advisories/GHSA-9qr9-h5gf-34mp) specifically for the Next.js framework.

This vulnerability was responsibly disclosed by myself, [Lachlan Davidson](https://github.com/lachlan2k) on 29 November 2025 PT to the Meta team. Initial disclosure and patch release was performed by React and Vercel on 3 December 2025 PT.

**Update:** Proof-of-Concepts
-----------------------------

A real public PoC began circulating after around 30 hours from initial disclosure, I've now shared my [PoCs](https://github.com/lachlan2k/React2Shell-CVE-2025-55182-original-poc) several hours later. Full writeup in due course :)

**Update:** A note on scanners (4 December 20:55 UTC)
-----------------------------------------------------

We've seen some great scanners from the likes of Assetnote, which are very effective at detecting unpatched Next.js instances that use Server Components.

However, there's another nuance that we'd like to highlight: The day-0 protections from some providers are actually runtime-level, and not just WAF rules. So many customers with theoretically vulnerable versions are, to our knowledge, still protected.

We're aware of many submissions to Bug Bounty programs, etc. based on these scanner outputs, many of which may be false positives. Unfortuantely, at this point in time, we cannot share any methods to concretely identify with certainity if you are vulnerable. So when in doubt: patch!

**Update:** A note on invalid PoCs (4 December 03:25 UTC)
---------------------------------------------------------

We have seen a rapid trend of "Proof of Concepts" spreading which are not genuine PoCs.

Anything that requires the developer to have explicitly exposed dangerous functionality to the client is not a valid PoC. Common examples we've seen in supposed "PoCs" are vm#runInThisContext, child\_process#exec, and fs#writeFile.

This would only be exploitable if you had consciously chosen to let clients invoke these, which would be dangerous no matter what. The genuine vulnerability does not have this constraint. In Next.js, the list of server functions is managed for you, and does not contain these.

Many of these "PoCs" have been referenced in publications, and even some vulnerability aggregators. We are concerned that these may lead to false negatives when evaluating if a service is vulnerable, or lead to unpreparedness if or when a genuine PoC surfaces.

Am I affected?
--------------

Refer to vendor advisories from [React](https://github.com/facebook/react/security/advisories/GHSA-fv66-9v8q-g76r) and [Next.js](https://github.com/vercel/next.js/security/advisories/GHSA-9qr9-h5gf-34mp).

How?
----

Watch this space. We're giving people time to patch

Credits
-------

Thank you to the teams from Meta and Vercel for their work throughout thie disclosure proccess. Their co-ordination with other vendors (such as WAF and infrastructure providers) also provided a meaningful security benefit to vulnerable parties from the very moment the CVE was published.

I'd also like to thank [Sylvie Mayer](https://x.com/_sy1vi3) for her initial input when I was exploring the potential of this vulnerability, her collaboration on building early scanners, reconnaissance tools, and alerting affected parties ASAP.

What happened to CVE-2025-66478?
--------------------------------

This CVE was (technically correctly) marked as a duplicate of CVE-2025-55182.

The decision to publish a second CVE for Next.js was made due to these exceptional circumstsances: Next.js does not include React as a traditional dependency - instead, they bundle it "vendored". So, if you're using Next.js, many dependency tools do not automatically recognise it as vulnerable.

This website is maintained by Lachlan Davidson, and is not affiliated with Meta, the React team, or Vercel.

</CVE-2025-55182>

你需要制作一个网站（仅一个页面），用于检测用户给定的网站是否存在 CVE-2025-55182 漏洞。漏洞描述见上文 <CVE-2025-55182>。漏洞的具体检测代码见 scanner.py。这个网站初始只有一个输入框、一个提交按钮，用户提交后，检测该网站是否存在 CVE-2025-55182 并在输入框下方显示结果。

注意，你的检测算法使用 TypeScript 编写，完全遵循 scanner.py 中的算法，不要做额外发挥。
