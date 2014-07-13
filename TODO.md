## Default use case scenario:

Our MVP should be: a link/button on the big site on all Movie torrent pages which points to either our "play link" or installer .exe (depending on whether the user has our app installed or not).

If user doesn't have our app installed, he downloads installer .exe, runs it and the app is installed on his PC. The app is launched by installer and installer also configures the app to start on boot.

The app sits in a tray and awaits "play links" from browser.

If the user has our app installed or just finished installing it, the "play link" is passed to the app and the app shows "info window" with torrent name, download status and possibly some ads.

As soon as enough data has been downloaded, the app will launch local, bundled copy of VLC player and will show user the video. User will be able to pause, rewind and stop the video.

If user closes the VLC window, the downloading stops and the app moves into "idle" state, waiting for the new "play link".

If user clicks on another "play link", the app will stop the currently playing/downloading video and will start downloading/playing a new one.

## For v1.0 (launch):

- We start with Windows 7 (64 bit). XP (32 bit) and Mac/Linux may follow in v2.0
- We don't support `.torrent` files, since most (all ?) torrent sites are moving to magnets anyway
- We need to choose a name for the app - Playtor, Torplay(er), Magplay(er), MagnetPlay(er), Magicplay(er) ?
- We use our own URI scheme instead of `magnet://` (`playtor://` ?).
    - This way we will not fight over `magnet://` links on the page with utorrent and bittorrent clients, which the user has already installed on his PC
    - The web server (big site) needs to decide which pages have that "download/play button" and which don't, e.g. we don't show the button:
        - If number of seeders is < 10 (20 ? 50 ?),
        - If torrent is NOT a movie or if movie format is not supported (blueray, dvd, iso)
        - if torrent size is too large (> 3 Gb)
    - We can start off with the big site and others might follow and add our button to their pages
- We need to find a way to display either "Download" button, which would download our installer  **OR**, when the app is ALREADY installed on user's PC - show the "Play" button with `playtor://` link
    - We can check if the app is already running on user's PC by sending a local HTTP request to the app. Right now the app supports: `<img onerror="this.onerror=null;this.src='http://placekitten.com/200/300';" src="http://127.0.0.1:34901/validate">`
    - The installer can set some kind of a parameter or variable in the OS, which our JS on the page will be able to access (???)
    - http://stackoverflow.com/questions/6964515/launching-app-or-app-store-from-safari - seems there is a trick with timeouts but we need to check it cross browser
    - Find out what github does to solve the same issue: if you have their native app installed, they show the "clone" button on the repo page, and if their native app is NOT installed - they show the download button. Their native app also registers their own URI scheme during installation. On Mac it's `github-mac://`, on windows: `github-windows://`
    - Use all approaches
- The app definitely needs a smart installer - a small exe, which would download the rest of the package during installation
- We need a way to download and install updates automagically for all installed instances (bug fixes, new features)
    - installer feature ?
    - have a small Windows service running in the background, checking our server for updated version ?
- We need to rewrite `processmagnet.exe` (Boris). In addition to making a POST request to the running app, it should try to launch the app if the POST request fails
- Since "info window" is an HTML page, we should load it from our server. This way we will be able to change UI and Ads on the fly for all running instances.
- We need to decide what is shown to the user in this "info window" and redesign the way it looks. Right now it looks ok, but we may want to change it. Also, now it only has one button "STOP DOWNLOADING" - do we need any other action buttons in it ?
- We don't show any Ads to the user during the first 2 weeks from the install time and turn the ads on after 2 weeks. This should be decided by our web server, which serves the HTML to "info window"
- We definitely need a lot of testing - check all possible scenarios and different torrent pages

## For v2.0:

 - Playback may not start AT ALL if there are not enough seeds for the torrent, so we need to show status info and smartly check for situations when no data is received for some time (e.g. for 15-20 seconds). Maybe abort the peerflix-execution if it seems impossible to stream it.
- *Custom VLC*: change bundled vlc package:
    - remove unused libs
    - make our special theme for vlc (change colors, buttons, layout)
- *Video Ads*: Show "info window" with HTML5/Flash player with a URL to a Video Ad, as soon as Video Ad has finished playing, we launch VLC to play the torrent from peerflix URL. Theoretically, the torrent should be ready to play by that time.
* *Notifications*:
- Until torrent is not ready to be played, we need to show "percentage" or "time till start". Find a way to calculate this percentage/time based on downloaded chunks and download speed
- *Subtitles*: we can check if the torrent contains subtitles, download them BEFORE we download the torrent and launch VLC with those subtitles. E.g. popcorntime also downloads subs from opensubtitles.org. So if the torrent doesn't have `.srt` file inside - check for the subs on external resource.
- *Preferences*: preferences menu item should launch a window with the following settings:
    - Which directory the torrents are downloaded to
    - What is the maximum cache size for all torrents (e.g. 10% of the available disk space, but not more than 30Gb)
    - How long our app should SEED those torrents. Right now the app clears the cache and stops seeding when the video has finished playing, but we may want to continue seeding the torrent for some time (a day, a week ?) to be the 'good guys' and not to abuse the torrent network
    - Bandwidth upload limit - should be set low as default. Like 25KB/s or something. Most users will be novice and never touch preferences. So we don't want to screw up their internet if it starts to max the upload and they then uninstall the app
