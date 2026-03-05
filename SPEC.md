Ein durch WarioWare inspiriertes Browserspiel.
Der Spieler kann entweder alleine oder mit unbegrenzt vielen Freunden WebWare spielen.
Sobald alle Spieler bereit sind, startet das Spiel nach ablauf eines 3 Sekunden Timers.
Alle Spieler absolvieren nacheinander Stages die im Schwierigkeitsgrad steigen.
Die Zeit die für jede Stage benötigt wird, wird gemessen.
Der schnellste Spieler einer Stage bekommt einen Punkt.
Ein Scoreboard zeigt die Spielerpunktzahlen live an.
Im Singleplayer-Modus wird nur die Zeit festgehalten.
Der Fortschritt des Spiels wird in einem Balken an der oberen Bildschirmkante angezeigt.
Der Fortschrittsbalken zeigt wie bei einem Rennen den Fortschritt jedes Spielers an.
Das Spiel enthält Musik welche die Geschwindikeit des Spiels untermalt.
Die Musik wird mit mit jeder erhöhung des Schwierigkeitsgrades schneller.

Das Spiel wird in React + Vite implementiert.
WebSockets für Multiplayer.
Der Server soll via Railway mit Docker gehostet werden.
Der Client soll auf GitHub Pages gehostet werden.
Serverruntime ist Bun.

Anti-Cheat ist nicht vorgesehen da die Multiplayer-Runden in privaten Räumen stattfinden.
Raum-Ids sollen in der URL wiedergespiegelt werden.
Jede Stage ist eine React-Komponente.
Jede Stage muss 5 Schwierigkeitsgrade unterstützen.
Jede Stage muss via Submit-Button (oder Enter-Taste) abgeschickt werden. Ist die Anforderung der Stage nicht erfüllt, gibt es keinen Punkt.
Die Auswahl der Stage ist zufällig, jedoch für alle Spieler gleich.
Die Stages sollen nachträglich einfach hinzufügbar sein.
Die Aufgabenstellung soll groß dargestellt werden. Zentral oben unter dem Fortschrittsbalken.
Beispiele für Stages:

- Captchas die schwieriger werden.
- Passwort-Formular mit Einschränkungen welche immer schwieriger werden.
- Daten-Formular das immer mehr Felder bekommt je höher der Schwierigkeitsgrad.
- Den richtigen Downloadbutton klicken der immer schwieriger zu finden ist neben Werbebannern.
- Aus einer Liste eines fiktiven Online-Shops den richtigen Artikel kaufen. Die Liste wird immer länger und unübersichtlicher

Audio-Lautstärke soll einstellbar sein.
Spieler müssen einen Namen wählen bevor sie in die Lobby kommen.
Das Spiel startet sobald alle bereit sind. (Ready Check)
Sobald alle Spieler alle Stages absolviert haben wird der Spieler mit den meisten Punkten zum Gewinner ernannt.
Alle Spieler haben nach dem Spiel die Option für ein Rematch. Dabei bleibt der Raum erhalten, wird aber in den Lobby State versetzt.
