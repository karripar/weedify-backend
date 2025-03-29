import ffmpeg from 'fluent-ffmpeg';
import path from 'path';

ffmpeg.setFfmpegPath('c:/ffmpeg/bin/ffmpeg.exe');
ffmpeg.setFfprobePath('c:/ffmpeg/bin/ffprobe.exe');

const makeVideoThumbail = (
  videoPath: string
): Promise<{thumbs: string[]; gif: string}> => {
  return new Promise((resolve, reject) => {
    const thumbs: string[] = [];
    const originalFilename = path.basename(videoPath);
    const gifFilename = `./uploads/${originalFilename}-animation.gif`; // new gif filename

    // some error handling
    try {
      ffmpeg.ffprobe(videoPath, (err, data) => {
        if (err) {
          console.log(err);
          return reject(err);
        }

        const rawDuration = data.format.duration;
        const duration =
          typeof rawDuration === 'number' && rawDuration > 0 ? rawDuration : 10; // default to 10 seconds
        const speedFactor = duration / 5;
        const validSpeedFactor =
          typeof speedFactor === 'number' && speedFactor > 0 ? speedFactor : 1; // default to 1

        ffmpeg()
          .input(videoPath)
          .screenshots({
            count: 3,
            filename: `./uploads/${originalFilename}-thumb-%i.png`, // new thumbnail filename
            size: '320x?',
          })
          .on('filenames', (filenames) => {
            filenames.forEach((filename) => {
              thumbs.push(filename); // push each thumbnail filename to the array
            });
          })
          .on('end', () => {
            ffmpeg()
              .input(videoPath)
              .outputOptions([
                '-filter_complex',
                `[0:v]setpts=(PTS-STARTPTS)/${validSpeedFactor},fps=10,scale=320:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=32[p];[b][p]paletteuse`,
                '-c:v',
                'gif',
                '-compression_level',
                '50',
                '-f',
                'gif',
              ])
              .output(gifFilename) // output gif filename
              .on('end', () => {
                resolve({thumbs, gif: gifFilename});
              })
              .on('error', (err) => {
                console.log(err);
                resolve({thumbs, gif: ''}); // resolve with empty gif on error so we can still return the thumbs
              })
              .run(); // run the ffmpeg command to create the gif
          })
          .on('error', (err) => {
            console.log(err);
            reject(err);
          });
      });
    } catch (error) {
      console.log(error);
      reject(error);
    }
  });
};

export default makeVideoThumbail;
