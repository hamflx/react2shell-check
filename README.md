React2Shell CVE-2025-55182 Web Scanner
======================================

本项目是一个基于 Next.js 的单页网站，用于检测指定站点是否可能受到 React2Shell 远程代码执行漏洞（CVE-2025-55182 / CVE-2025-66478）的影响。

扫描核心逻辑为 TypeScript 版本的移植实现，严格遵循原始 Python 工具 `react2shell-scanner` 的算法。

> 原始扫描器项目出处（Assetnote）：  
> https://github.com/assetnote/react2shell-scanner

⚠️ 使用前须知
--------------

- 仅在你已获得授权的目标上使用本工具。  
- 工具使用与原 PoC 等价的检测方式，可能触发目标服务 WAF/审计/告警。  
- 本项目仅供安全研究与防御加固使用，作者不对任何非法或未授权使用负责。

开发环境与启动
--------------

安装依赖（任选其一）：

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

启动开发服务器后访问：

- 浏览器打开 `http://localhost:3000`

使用方法
--------

1. 在首页输入要检测的网站地址（例如 `https://example.com` 或 `example.com`）。  
2. 点击「开始检测」。  
3. 页面会在输入框下方显示结果：
   - 若检测到存在漏洞，将给出“存在 CVE-2025-55182 漏洞”的提示，以及 HTTP 状态码；
   - 若未检测到漏洞，将给出“未检测到 CVE-2025-55182 漏洞”的提示；
   - 若请求失败或检测出错，会显示对应错误信息。

实现说明
--------

- 核心检测逻辑位于：`lib/scanner.ts`
  - 实现了与 `scanner.py` 等价的函数：`normalizeHost`、`buildSafePayload`、`buildVercelWafBypassPayload`、`buildRcePayload`、`resolveRedirects`、`sendPayload`、`checkVulnerability` 等。
  - 使用 `fetch` 和 `AbortController` 实现超时控制，严格按照原 Python 工具的行为进行请求构造和响应判断。
- API 接口：
  - 路径：`POST /api/scan`
  - 请求体：`{ "host": "<要检测的站点>" }`
  - 返回值：与原工具 `check_vulnerability` 返回结构一致（JSON）。
- 前端页面：
  - 文件：`app/page.tsx`
  - 提供单个输入框和一个提交按钮，并在输入框下方渲染检测结果。

致谢
----

- 原始 React2Shell 扫描器和研究工作来自 Assetnote Security Research Team：  
  https://github.com/assetnote/react2shell-scanner

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
