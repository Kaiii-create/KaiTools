# KTool Privacy Policy

Last updated: July 22, 2026

KTool is a local-first Windows desktop application. It does not require an
account or login and does not use analytics, advertising, telemetry, or a
developer-operated cloud service.

## Data stored on your device

KTool may store the following data locally in the application's WebView
storage:

- application settings, theme, navigation preferences, and favorites;
- tool history, including tool inputs and outputs, for features where history
  is enabled;
- keyboard statistics, including aggregated key counts, shortcut counts, and
  daily totals;
- desktop keyboard widget preferences.

Tool history may contain sensitive text entered by the user. For example, HTTP
request history can contain URLs, headers, cookies, request bodies, and response
bodies. Local application data is not end-to-end encrypted by KTool. Do not
store secrets in history on a device you do not trust. History and keyboard
statistics can be cleared from within the application.

## Keyboard statistics

When keyboard statistics are enabled, KTool uses a Windows global keyboard hook
to count key identifiers and shortcut combinations across applications. KTool
stores aggregate counts only. It does not store the ordered text you type,
window titles, focused application names, clipboard contents, or screenshots.

Keyboard statistics remain on the user's device and are not transmitted by
KTool. Recording can be paused from the keyboard statistics window and the
saved preference is used on later launches.

## Network access

KTool does not make automatic background network requests and does not
automatically check for updates. Network access occurs only as a direct result
of a user action, including:

- sending a request with the HTTP request tool;
- loading a remote image supplied by the user for QR code decoding;
- loading remote content referenced in a Markdown preview;
- opening a website, repository, email, or other external link;
- downloading content returned by a user-requested operation.

Requests are sent directly from the user's device to the destination selected
by the user. They are not proxied through a KTool-operated server. The
destination service may receive the user's IP address and any URL, headers,
cookies, body, or other content included in the request. That service's own
privacy policy and security practices apply.

Viewing the KTool repository or downloading a release from GitHub is governed
by the [GitHub Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement).
SignPath may be used by the project's release workflow to sign official
binaries; the installed KTool application does not send user data to SignPath.

## Data collection and sharing

KTool does not automatically collect, upload, sell, or share personal data.
The project maintainer cannot access data stored locally by KTool unless the
user deliberately includes it in an Issue, support request, or other message.

## Changes to this policy

Material changes to this policy will be published in this repository. The
"Last updated" date above identifies the current version.

## Contact

Privacy questions can be submitted through
[GitHub Issues](https://github.com/Kaiii-create/KaiTools/issues).

---

# KTool 隐私政策

更新日期：2026 年 7 月 22 日

KTool 是一款本地优先的 Windows 桌面应用，无需注册或登录，不包含广告、
使用分析或遥测，也没有由开发者运营的云端服务。

KTool 会在用户设备本地保存应用设置、工具历史记录、键盘统计和桌面小窗设置。
工具历史可能包含用户输入和输出；HTTP 请求历史还可能包含 URL、请求头、
Cookie、请求体和响应体。这些本地数据不会由 KTool 进行端到端加密，请勿在不可信
设备的历史记录中保存密钥等敏感信息。用户可以在应用内清空历史记录和键盘统计。

启用键盘统计后，KTool 会通过 Windows 全局键盘钩子统计按键标识、快捷键组合、
每日次数和历史总数。KTool 不保存按键的输入顺序、完整输入文字、窗口标题、
当前应用名称、剪贴板内容或屏幕截图；这些统计不会被 KTool 上传。用户可以随时暂停。

KTool 不会在后台自动联网，也不会自动检查更新。只有用户主动发送 HTTP 请求、
加载用于二维码解码的远程图片、预览 Markdown 中的远程资源、打开外部链接，或
下载用户请求的内容时才会联网。请求会从用户设备直接发送到用户指定的目标服务，
不会经过 KTool 的服务器。目标服务可能获得用户 IP 地址以及请求中包含的数据，
并适用该服务自己的隐私政策。

KTool 不会自动收集、上传、出售或共享个人数据。除非用户主动将本地内容附加到
Issue、支持请求或其他消息中，否则项目维护者无法访问这些本地数据。

隐私相关问题可通过 [GitHub Issues](https://github.com/Kaiii-create/KaiTools/issues)
提交。
