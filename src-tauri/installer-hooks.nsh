; KTool NSIS 安装器扩展：首次安装时优先使用 D:\KTool。
; Tauri 的 .onInit 会先恢复已有安装目录；MUI 随后调用此函数，
; 因此只在路径仍为默认值时改写，升级时继续沿用原目录。
!define MUI_CUSTOMFUNCTION_GUIINIT KToolSetDefaultInstallDir

Function KToolSetDefaultInstallDir
  StrCmp $INSTDIR "$LOCALAPPDATA\KTool" 0 ktool_install_dir_done
  IfFileExists "D:\*.*" 0 ktool_install_dir_done
  StrCpy $INSTDIR "D:\KTool"
ktool_install_dir_done:
FunctionEnd

; 静默安装没有可见页面，再在复制文件前进行同样的安全处理。
!macro NSIS_HOOK_PREINSTALL
  StrCmp $INSTDIR "$LOCALAPPDATA\KTool" 0 ktool_preinstall_done
  IfFileExists "D:\*.*" 0 ktool_preinstall_done
  StrCpy $INSTDIR "D:\KTool"
ktool_preinstall_done:
!macroend
