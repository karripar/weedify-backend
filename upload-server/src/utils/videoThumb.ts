import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import { UPLOAD_DIR } from './paths';

const ffmpegPath = process.env.FFMPEG_PATH || '/usr/bin/ffmpeg';
const ffprobePath = process.env.FFPROBE_PATH || '/usr/bin/ffprobe';

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const makeVideoThumbail = (
  videoPath: string
): Promise<{ thumbs: string[]; gif: string }> => {
  return new Promise((resolve, reject) => {
    const thumbs: string[] = [];
    const originalFilename = path.basename(videoPath);
    const baseName = path.parse(originalFilename).name;
    const gifFilename = path.join(UPLOAD_DIR, `${baseName}-animation.gif`);
    const paletteFilename = path.join(UPLOAD_DIR, `${baseName}-palette.png`);

    try {
      ffmpeg.ffprobe(videoPath, (err, data) => {
        if (err) {
          console.log(err);
          return reject(err);
        }

        const rawDuration = data.format.duration;
        const duration = typeof rawDuration === 'number' && rawDuration > 0 ? rawDuration : 10;
        const speedFactor = duration / 5;
        const validSpeedFactor = speedFactor > 0 ? speedFactor : 1;

        // Generate thumbnails
        ffmpeg(videoPath)
          .screenshots({
            count: 3,
            filename: `${baseName}-thumb-%i.png`,
            folder: UPLOAD_DIR,
            size: '320x?',
          })
          .on('filenames', (filenames) => {
            filenames.forEach((filename) => thumbs.push(path.join(UPLOAD_DIR, filename)));
          })
          .on('end', () => {
            // First pass: generate palette
            ffmpeg(videoPath)
              .outputOptions([
                `-vf`,
                `setpts=(PTS-STARTPTS)/${validSpeedFactor},fps=10,scale=320:-1:flags=lanczos,palettegen=max_colors=32`,
              ])
              .output(paletteFilename)
              .on('end', () => {
                // Second pass: use palette to generate GIF
                ffmpeg(videoPath)
                  .input(paletteFilename)
                  .complexFilter([
                    `[0:v]setpts=(PTS-STARTPTS)/${validSpeedFactor},fps=10,scale=320:-1:flags=lanczos[x];[x][1:v]paletteuse`,
                  ])
                  .outputOptions([
                    '-c:v', 'gif',
                    '-compression_level', '50',
                  ])
                  .output(gifFilename)
                  .on('end', () => {
                    resolve({ thumbs, gif: gifFilename });
                  })
                  .on('error', (err) => {
                    console.error('GIF generation error:', err);
                    resolve({ thumbs, gif: '' });
                  })
                  .run();
              })
              .on('error', (err) => {
                console.error('Palette generation error:', err);
                resolve({ thumbs, gif: '' });
              })
              .run();
          })
          .on('error', (err) => {
            console.error('Thumbnail error:', err);
            reject(err);
          });
      });
    } catch (error) {
      console.error('Outer error:', error);
      reject(error);
    }
  });
};

export default makeVideoThumbail;
