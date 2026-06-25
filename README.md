# 计算机网络复习宝典 APK

一个离线刷 372 道计算机网络题目的 Android APK，支持：

- 刷题 / 记题 / 错题本 / 章节记忆卡片
- 错题连续答对次数可配置
- 导出当前题目、错题本 Markdown、章节卡片
- 基于 GitHub Release 的联网检查更新、下载 APK、调起系统安装、自动清理缓存安装包

## 本地构建

```powershell
python .\tools\build_network_quiz_apk.py
```

输出 APK：

`E:\Learning\课程学习\计算机网络\计算机网络_考试练习_APK\build\out\计算机网络复习宝典.apk`

## 生成 Release 元数据

```powershell
python .\tools\generate_release_metadata.py
```

会生成：

`E:\Learning\课程学习\计算机网络\计算机网络_考试练习_APK\release\network_quiz_update.json`

这个文件会被 App 用来更稳地识别线上版本号。

## 发布到 GitHub Release

先确保已经登录 GitHub CLI：

```powershell
gh auth login
```

然后执行：

```powershell
.\tools\publish_github_release.ps1 -RepoSlug ZhiKong0/review-baodian-apk
```

脚本会：

1. 重新构建 APK
2. 生成 `release/network_quiz_update.json`
3. 按传入仓库生成面向 App 的更新元数据
4. 创建 `v版本号` 的 GitHub Release
5. 上传 APK 和 `network_quiz_update.json`

## 真实更新验证顺序

当前已验证的默认更新源基线：

- 默认更新仓库：`ZhiKong0/review-baodian-apk`
- App 首次启动会自动写入默认仓库
- App 打开后会自动检查更新；发现新版本时会弹窗询问是否更新

推荐的真实联网更新验证顺序：

1. 先登录 GitHub CLI：`gh auth login`
2. 确认要发布到的仓库，例如当前默认仓库 `ZhiKong0/review-baodian-apk`
3. 把源码版本提升到一个高于 `2.10.0` 的新版本，例如：

```powershell
python .\tools\bump_network_quiz_version.py --version-name 2.10.1 --version-code 26
```

4. 检查并补充 `release\RELEASE_NOTES.md`
5. 发布真实 GitHub Release：

```powershell
.\tools\publish_github_release.ps1 -RepoSlug ZhiKong0/review-baodian-apk
```

6. 打开手机或模拟器里的 App，等待自动检查更新，或手动点“检查更新”
7. 验证发现新版本、下载、安装、安装后清理缓存 APK 的整条链路

## App 内更新配置

默认情况下，APK 会直接使用：

`ZhiKong0/review-baodian-apk`

如果以后你迁移到新仓库，也可以在“设置 -> 版本更新”里手动改成新的 `owner/repo` 或完整 GitHub 链接。
