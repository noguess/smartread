# Video Assets Directory

This directory is reserved for local video lecture files.

## File Naming Convention
- All video files should be named in **lowercase** following the pattern: `{word}.mp4`
- Examples:
  - `information.mp4`
  - `ambitious.mp4`
  - `apple.mp4`

## Usage
When a user clicks on a word, the system will:
1. Get the current word (e.g., "Apple")
2. Convert to lowercase (e.g., "apple")
3. Try to load `/videos/apple.mp4`
4. If found: play video in modal
5. If not found: show "暂无视频讲解" message
