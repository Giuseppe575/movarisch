ICONA MOVARISCH
================

Per completare l'installer, è necessario aggiungere un'icona personalizzata:

📁 File richiesto: icon.ico
📏 Dimensioni consigliate: 256x256px (multi-resolution)
📍 Posizione: installer/build/icon.ico

COME CREARE L'ICONA:
-------------------

Opzione 1 - Online (Più semplice):
1. Vai su https://convertio.co/it/png-ico/
2. Carica un PNG del logo MOVARISCH (256x256px)
3. Converti in .ico
4. Scarica e rinomina come "icon.ico"
5. Metti il file in questa cartella (installer/build/)

Opzione 2 - GIMP (Gratuito):
1. Scarica GIMP: https://www.gimp.org/
2. Apri/Crea un'immagine 256x256px
3. Esporta come .ico (File → Esporta come → icon.ico)
4. Metti il file in questa cartella

Opzione 3 - ImageMagick (Linea di comando):
```bash
magick convert logo.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```

ICONA TEMPORANEA:
----------------
Se non hai ancora un'icona, puoi usare un'icona generica di Windows.
L'installer funzionerà comunque, ma senza icona personalizzata.

Per usare un'icona generica temporanea:
1. Copia un qualsiasi file .ico in questa cartella
2. Rinominalo come "icon.ico"
3. Genera l'installer

SPECIFICHE TECNICHE:
-------------------
- Formato: .ico (Windows Icon)
- Risoluzioni consigliate: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256
- Profondità colore: 32-bit (RGBA)
- Trasparenza: Supportata

Una volta aggiunto icon.ico, il build process lo userà automaticamente per:
✓ Icona dell'applicazione
✓ Icona dell'installer
✓ Icona nel menu Start
✓ Icona sul Desktop
