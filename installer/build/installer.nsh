; MOVARISCH - Script personalizzato NSIS Installer
; Questo file viene incluso automaticamente da electron-builder durante la creazione dell'installer

; Messaggi personalizzati in italiano
!macro customInit
  ; Controlla se è già installato
  ReadRegStr $0 HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\{${UNINSTALL_APP_KEY}}" "UninstallString"
  ${If} $0 != ""
    MessageBox MB_YESNO|MB_ICONQUESTION "MOVARISCH è già installato. Vuoi disinstallare la versione precedente?" IDYES uninst IDNO done
    uninst:
      ExecWait '$0 /S _?=$INSTDIR'
      Delete "$0"
    done:
  ${EndIf}
!macroend

; Messaggio di benvenuto personalizzato
!macro customWelcomePage
  ; Nessuna personalizzazione aggiuntiva per ora
!macroend

; Azioni post-installazione
!macro customInstall
  ; Crea file di versione
  FileOpen $0 "$INSTDIR\version.txt" w
  FileWrite $0 "MOVARISCH v1.1.0$\r$\n"
  FileWrite $0 "Installato il: $\r$\n"
  FileWrite $0 "Sviluppato da: Giuseppe$\r$\n"
  FileClose $0

  ; Messaggio di installazione completata
  ; (verrà mostrato solo se runAfterFinish è false)
!macroend

; Azioni pre-disinstallazione
!macro customUnInstall
  ; Chiedi conferma prima di disinstallare
  MessageBox MB_YESNO|MB_ICONQUESTION "Sei sicuro di voler disinstallare MOVARISCH?" IDYES cont IDNO abort
  cont:
    ; Continua con la disinstallazione
    Goto done
  abort:
    ; Annulla la disinstallazione
    Abort "Disinstallazione annullata."
  done:
!macroend

; Header personalizzato
!macro customHeader
  !system "echo 'Building MOVARISCH Installer...'"
!macroend
