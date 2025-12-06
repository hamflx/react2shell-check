'use client';

import { useState } from "react";

type ScanResult = {
  host: string;
  vulnerable: boolean | null;
  status_code: number | null;
  error: string | null;
  final_url: string | null;
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setResult(null);

    const trimmed = url.trim();
    if (!trimmed) {
      setError("请输入要检测的网站地址");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ host: trimmed }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(data?.error ?? "请求失败，请稍后重试");
        return;
      }

      const data = (await response.json()) as ScanResult & {
        response?: string | null;
        request?: string | null;
        timestamp?: string;
      };
      setResult({
        host: data.host,
        vulnerable: data.vulnerable,
        status_code: data.status_code,
        error: data.error ?? null,
        final_url: data.final_url ?? null,
      });
    } catch (e) {
      setError("请求失败，请检查网络连接");
    } finally {
      setLoading(false);
    }
  };

  const renderResult = () => {
    if (error) {
      return <p className="mt-4 text-sm text-red-600">{error}</p>;
    }
    if (!result) {
      return null;
    }

    if (result.error) {
      return (
        <p className="mt-4 text-sm text-orange-600">
          检测失败：{result.error}
        </p>
      );
    }

    if (result.vulnerable) {
      return (
        <p className="mt-4 text-sm font-medium text-red-600">
          结果：{result.host} 存在 CVE-2025-55182 漏洞
          {result.status_code !== null && `（HTTP 状态码：${result.status_code}）`}
        </p>
      );
    }

    return (
      <p className="mt-4 text-sm font-medium text-emerald-700">
        结果：{result.host} 未检测到 CVE-2025-55182 漏洞
        {result.status_code !== null && `（HTTP 状态码：${result.status_code}）`}
      </p>
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="w-full max-w-xl rounded-lg bg-white p-8 shadow-sm dark:bg-zinc-950">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          React2Shell (CVE-2025-55182) 漏洞检测
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          输入要检测的网站地址，点击“开始检测”以判断是否存在 React2Shell 漏洞。
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
            目标网址
          </label>
          <input
            type="text"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="例如：https://example.com"
            className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-500"
          >
            {loading ? "检测中..." : "开始检测"}
          </button>
        </form>

        {renderResult()}

        <p className="mt-8 text-xs text-zinc-500 dark:text-zinc-500">
          项目仓库：
          <a
            href="https://github.com/hamflx/react2shell-check"
            className="ml-1 underline"
            target="_blank"
            rel="noreferrer"
          >
            https://github.com/hamflx/react2shell-check
          </a>
        </p>
      </main>
    </div>
  );
}
