const path = require('path');

const {processSample} = require('./sample-processor.js');

//10 second clips of the same song in sequential order. This is expected to pass. 
// const testSamples = [
//     {
//         file: 'test1.mp4',
//         capturedAt: 100000
//     },
//     {
//         file: 'test2.mp4',
//         capturedAt: 110000
//     },
//     {
//         file: 'test3.mp4',
//         capturedAt: 120000
//     },
//     {
//         file: 'test4.mp4',
//         capturedAt: 130000
//     }
// ];

//10 second clips of the same song, but test3-bad has a timecode outside of the threshold. This is expected to fail and reset the match counter. 
const testSamples = [
    {
        file: 'test1.mp4',
        capturedAt: 100000
    },
    {
        file: 'test2.mp4',
        capturedAt: 110000
    },
    {
        file: 'test3-bad.mp4',
        capturedAt: 120000
    }
];

//Two different songs to represent the transition between songs. 
// const testSamples = [
//     {
//         file: 'songA1.mp4',
//         capturedAt: 100000
//     },
//     {
//         file: 'songA2.mp4',
//         capturedAt: 110000
//     },
//     {
//         file: 'songA3.mp4',
//         capturedAt: 120000
//     },

//     {
//         file: 'songB1.mp4',
//         capturedAt: 130000
//     },
//     {
//         file: 'songB2.mp4',
//         capturedAt: 140000
//     },
//     {
//         file: 'songB3.mp4',
//         capturedAt: 150000
//     }
// ];

//testing silence
// const testSamples = [
//     {
//         file: 'silence1.mp4',
//         capturedAt: 100000
//     },
//     {
//         file: 'silence1.mp4',
//         capturedAt: 110000
//     },
//     {
//         file: 'silence1.mp4',
//         capturedAt: 120000
//     }
// ];


//testing A A A B A
// const testSamples = [
//     {
//         file: 'test1.mp4',
//         capturedAt: 100000
//     },
//     {
//         file: 'test2.mp4',
//         capturedAt: 110000
//     },
//     {
//         file: 'test3.mp4',
//         capturedAt: 120000
//     },
//     {
//         file: 'songA1.mp4',
//         capturedAt: 100000
//     },
//     {
//         file: 'test4.mp4',
//         capturedAt: 130000
//     }
// ];




async function runTest() {
    console.log('\nStarting AudD validator integration test...\n');

    for (const sample of testSamples) {
        const filePath = path.join(__dirname, 'samples', sample.file);

        await processSample(filePath,sample.capturedAt);
    }

    console.log('\nTest complete.');
}

runTest();

