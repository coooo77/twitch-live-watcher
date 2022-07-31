# twitch-live-watcher

Download videos on Twitch.

![](https://i.imgur.com/bGTg479.png)

## Features
* ⏺️ record online stream and latest VOD automatically
* 💾 download VOD manually
* ⚙️ customize record setting for streamers
* ✒️ specify a filename template with wildcards for downloads
* 📞 online notification for streamers 
* ⏱ specify a download time for downloads
* 🧲 filter for game tag
 

## Prerequisites

* install [Streamlink](https://streamlink.github.io/) (minor version 3.0.0)
* install [FFmpeg](https://ffmpeg.org/) and add ffprobe.exe to path in environment variable (optional)
* follow streamers you want to record (App detects online streamers from user's follow list)

## Installation

[Installer](https://github.com/coSevenSeven/twitch-live-watcher/releases/tag/v1.0.0)

## Configuration

### General Setting

| name                     | function                                                         |
|--------------------------|------------------------------------------------------------------|
| Check Stream Interval    | interval for online check (unit: seconds)                        |
| Dir To Save Record       | directory path where files save                                  |
| number of Download Limit | numbers of live stream recorder allow to run, set 0 as unlimited |

### VOD Setting

deal with VOD downloads

| name                         | function                                                  |
|------------------------------|-----------------------------------------------------------|
| Retry Download Interval      | minutes to download VOD again when VOD download is failed |
| Max redownload Times         | maximum times to download VOD                             |
| Loss of VOD Duration Allowed | acceptable amount of loss duration (unit: seconds)        |
| Integrity Check              | check duration while VOD downloaded by ffprobe            |

### Record Setting

default streamers record setting for new add streamer

| name                                        | function                                                                                               |
|---------------------------------------------|--------------------------------------------------------------------------------------------------------|
| Enable Record                               | enable record stream                                                                                   |
| Enable Notify                               | enable notify when streamer online                                                                     |
| Enable Record VOD                           | enable record vod                                                                                      |
| Is Stop Record Stream                       | disable record stream while vod is available                                                           |
| Get Stream If No Vod                        | enable record stream while vod is not available                                                        |
| VOD Mode                                    | VOD download mode, three mode available, queue, timeZone and countDown                                 |
| Count Down In Minutes                       | download VOD after x minutes                                                                           |
| Timezone                                    | download VOD after specified time zone                                                                 |
| VOD Filename Template                       | Specify a default filename for live stream downloads                                                   |
| Check Stream Content Type Enable            | enable check game name; Check VOD and live streams if enabled                                          |
| Check Stream Content Type Target Game Names | check stream game names, stop record if not included. Use ";" to separate tags. e.g. Art;Just Chatting |
| Filename Template                           | specify a default filename for VOD downloads                                                           |
