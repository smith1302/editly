async function titleBarFrameSource({ width, height, params }) {
    const {text = '', barHeight = 100, textColor = '#ffffff', barColor = '#000000'} = params;

    async function onRender(progress, canvas) {
        const padding = 0.04 * barHeight;
        const fontSize = (width / 14) - (Math.max(0, (text.length - 15)) * 0.45);

        fabric.Textbox.prototype._renderChar = function(method, ctx, lineIndex, charIndex, _char, left, top) {
            // Render emoji
            if (_char === '□') {
                const emoji = originalString.charAt(charIndex);
                console.log(`Found emoji at index ${charIndex}. Emoji is ${emoji}`);
                /*
                // Draw emoji
                const emoji = this.emojis[this.emojiCodes[this.emojisCodeIndex]]
                emoji.set({
                    left,
                    top: top - this.options.fontSize + 2
                })
                emoji.scaleToWidth(this.options.fontSize)
                emoji.scaleToHeight(this.options.fontSize)
                emoji.drawObject(ctx)
                
                // Set emoji index of next emoji
                this.emojisCodeIndex++
                if (this.emojisCodeIndex > this.emojiCodes.length - 1) {
                    this.emojisCodeIndex = 0
                }
                */
            }
        }

        const textBox = new fabric.Textbox(text, {
            fill: textColor,
            fontFamily: 'sans-serif',
            fontSize: fontSize,
            fontWeight: 'bold',
            textAlign: 'center',
            left: width / 2,
            top: barHeight / 2,
            width: width - padding * 2,
            originX: 'center', 
            originY: 'center',
        });
        
        const rect = new fabric.Rect({
            left: -1,
            top: -1,
            width: width + 1,
            height: barHeight + 1,
            fill: barColor,
        });
        
        canvas.add(rect);
        canvas.add(textBox);
    }
    
    function onClose() {
        // Cleanup if you initialized anything
    }
    
    return { onRender, onClose };
}

module.exports = titleBarFrameSource;