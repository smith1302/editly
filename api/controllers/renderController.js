const editly = require('editly');
const fs = require('fs');

exports.createGIF = function(req, res) {
    try {

        const projectRoot = process.env.PWD;
        const gifDir = `${projectRoot}/static/gifs`;
        fs.readdir(gifDir, (err, files) => {
            if (err) console.log(err);
            for (const file of files) {
                fs.unlink(`${gifDir}/${file}`, err => {
                    if (err) console.log(err);
                    console.log(`Removing ${gifDir}/${file}`);
                });
            }
        });

        var file = "vid_"+(Math.random() * 1000)+".gif";
        console.log(`http://157.245.139.12/static/gifs/${file}`);
        
        var reviews = [
            {
                rating: 5,
                text: "My cat was interested in it. She was playing with it for a couple minutes when I unpackaged the product. I think it will keep her entertaine...",
                image: `${projectRoot}/assets/img2.jpg`,
                date: 'Jan 27th 2020',
            },
            {
                rating: 5,
                text: "This is a test",
                image: `${projectRoot}/assets/img3.jpg`,
                date: 'Jan 27th 2020',
            },
            {
                rating: 5,
                text: "Mon chat s'y intéressait. Elle a joué avec pendant quelques minutes lorsque j'ai déballé le produit. Je pense que ça la divertira",
                image: `${projectRoot}/assets/img1.jpg`,
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
            outPath: `${gifDir}/${file}`,
            fast: false,
            defaults: {
                transition: { name: 'crosszoom' },
                layer: { fontPath: `${projectRoot}/assets/TwitterColorEmoji-SVGinOT.ttf` },
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

        res.status(200).json();
    } catch (e) {
        res.status(400).json({error: e.message});
    }
};