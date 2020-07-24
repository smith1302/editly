const editly = require('editly');
const { fabric } = require('fabric');
const fileUrl = require('file-url');

var file = "vid_"+(Math.random() * 1000)+".gif";
console.log(`http://157.245.139.12/${file}`);

var reviews = [
  {
    rating: 5,
    text: "My cat was interested in it. She was playing with it for a couple minutes when I unpackaged the product. I think it will keep her entertaine...",
    image: './assets/img2.jpg',
    date: 'Jan 27th 2020',
  },
  {
    rating: 5,
    text: "This is a test",
    image: './assets/img3.jpg',
    date: 'Jan 27th 2020',
  },
  {
    rating: 5,
    text: "Mon chat s'y intéressait. Elle a joué avec pendant quelques minutes lorsque j'ai déballé le produit. Je pense que ça la divertira",
    image: './assets/img1.jpg',
    date: 'Jan 27th 2020',
  }
]

const width = 320;
const aspectRatio = 420/320;
const height = aspectRatio * width;
const reviewPadding = 0.07 * width;

editly({
    width: width,
    height: height,
    fps: 14,
    outPath: `/var/www/html/${file}`,
    fast: false,
    defaults: {
        transition: { name: 'crosszoom' },
        layer: { fontPath: './assets/TwitterColorEmoji-SVGinOT.ttf' },
    },
    
    clips: reviews.map(({ rating, text, image, date }) => ({
          duration: 8, 
          transition: { name: 'crosszoom' },
          layers: [
            { 
              type: 'image', 
              path: image, 
              zoomDirection: 'in', 
              zoomAmount: '0.35', 
              resizeMode: 'cover'}, 
            { 
              type: 'review', 
              rating: rating, 
              text: `❝${text}❞`, 
              dateString: date, 
              padding: reviewPadding,
            },
          ] 
      })),
}).catch(console.error);

// To run this
// rm /var/www/html/k.mp4 && xvfb-run -s "-ac -screen 0 1280x1024x24" node test.js 