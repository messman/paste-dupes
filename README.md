# paste-dupes

A simple web tool for finding duplicates in lists and between lists.

![Screenshot](screenshot.png?raw=true "Screenshot")

## Background

I used to use Apple's iTunes for my music playlist management, and iTunes included a special function for managing duplicates:
you could select all instances of all duplicates in a playlist. This simple thing made it trivial to remove duplicates, of course,
but it also made it trivial to compare two playlists to find what was different between them:
- First, remove all duplicates from both playlists A and B.
- Copy playlist A and playlist B into an empty playlist C, then select duplicates. These songs were in both playlists.
You could then do additional copy maneuvers to find out songs that were in A, but not B, and so on.

Moving to Spotify so many years later, I wanted the same control and found it did not exist. I would have to manually scour for
duplicates and never know what songs were in common between playlists.

Finally, after discovering that copy-pasting Spotify song items into a text field pastes the song URLs, I realized it would be possible
to make a text-array comparison tool that functioned as a Spotify de-duplicate tool. This is that tool.

## Features

For a pasted-in or typed text `A` where items of `A` are lines of text,

- Get `A'` with all duplicates reduced to one entry
- Get `A'` with all duplicates and their originals removed
- Get `A'` with only the duplicates of A

For a second pasted-in or typed text `B` where items of `B` are lines of text,

- Get `C = A & !B` with only the items that were in A and not in B
- Get `C = B & !A` with only the items that were in B and not in A
- Get `C = A & B` with only the items that were in A and B
