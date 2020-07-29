const editly = require('editly');
const fs = require('fs');
const jwt = require('jsonwebtoken');

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
	const httpFileURL = `http://157.245.139.12/static/gifs/${file}`;
        console.log(httpFileURL);
	/*        
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
        ]*/
	const token = req.body.token;
	const decoded = jwt.verify(token, 'reallycoolkey');
	const timeSinceRequest = (new Date()).getTime() - decoded.requestTime;
	if (timeSinceRequest > 400) {
		throw new Error("Request time is not valid.");
	}
	
	if (!req.body.data || req.body.data.reviews.length == 0) {
		throw new Error("Missing reviews.");
	}
	const reviews = req.body.data.reviews;
        
        const width = 320;
        const aspectRatio = 420/320;
        const height = aspectRatio * width;
        const reviewPadding = 0.07 * width;

	const outPath = `${gifDir}/${file}`;
        
        editly({
            width: width,
            height: height,
            fps: 14,
            outPath: outPath,
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

        res.status(200).json({mediaURL: httpFileURL});
    } catch (e) {
        res.status(400).json({error: e.message});
    }
};
