async function reviewFrameSource({ width, height, params }) {
    const {text, rating, padding, containerRect = {x:0, y:0, width: width, height: height}, dateString = ''} = params;
    const backgroundColor = '#ffffff';
    const textColor = '#333333'
    const fontFamily = 'sans-serif';
    const cornerRadius = 0.01 * containerRect.width;
    const defaultFontSize = containerRect.width / 13;
    
    async function onRender(progress, canvas) {
        function slideInOut(startSlideIn, dur, startSlideOut) {
            if (progress < startSlideOut) {
                return (easeOutExpo(Math.min(1, Math.max(0, (progress - startSlideIn) / dur)))) / 2;
            }
            return 0.5 + (easeInOutCubic(Math.min(1, Math.max(0, (progress - startSlideOut) / dur)))) / 2;
        }
        
        const centerX = containerRect.x + containerRect.width / 2;
        const centerY = containerRect.y + (containerRect.height / 2);
        const visibleRectWidth = containerRect.width - padding * 2;
        const textGroupWidth = visibleRectWidth - padding * 2;
        
        const easedProgress = slideInOut(0.2, 0.06, 0.8);
        const animOffsetX = containerRect.width - (containerRect.width * 2) * easedProgress;
        
        // If there's no review text, center align everything or it looks funny
        const hasText = text.length > 0;
        
        const verified = new fabric.Textbox("Verified Review", {
            fill: textColor,
            fontFamily,
            fontSize: containerRect.width / 29,
            originX: 'left',
            originY: 'top',
            textAlign: hasText ? 'left' : 'center',
            left: 0,
            top: 0,
            width: textGroupWidth,
            opacity: 0.6
        });
        const verifiedBottom = verified.top + verified.height;
        
        // Make shrink text if there's a lot of it
        let textBox = null;
        if (hasText) {
            const shrinkThreshold = 70;
            const shrinkRate = 420; // Lower = faster shrinkage
            const charDiff = Math.max(0, text.length - shrinkThreshold);
            const adjustment = 1 - (charDiff / shrinkRate);
            const fontSize = defaultFontSize * adjustment;
            textBox = new fabric.Textbox(text, {
                fill: textColor,
                fontFamily,
                fontSize: fontSize,
                fontWeight: 'bold',
                textAlign: 'left',
                originX: 'left',
                originY: 'top',
                left: 0,
                top: verifiedBottom + padding / 2,
                width: textGroupWidth,
            });
            const ratio = ((containerRect.height - padding * 4) * 0.8) / textBox.height;
            if (ratio < 1) {
                textBox.set('fontSize', ratio * fontSize); 
            }
        }
        
        const starsTop = textBox ? (textBox.top + textBox.height) : verifiedBottom;
        const starString = new Array(rating + 1).join('★');
        let starsOptions = {
            fill: '#ffc107',
            fontFamily,
            fontSize: hasText ? containerRect.width / 17 : containerRect.width / 10,
            fontWeight: 'bold',
            textAlign: hasText ? 'left' : 'center',
            left: 0,
            top: starsTop + padding / 2,
            originX: 'left', 
            originY: 'top',
        };
        if (!hasText) starsOptions.width = textGroupWidth;
        const stars = new fabric.Textbox(starString, starsOptions);
        
        const showInlineDate = hasText;
        const dateOriginY = showInlineDate ? 'center' : 'top';
        const dateTextAlignment = showInlineDate ? 'left' : 'center';
        const dateStartX = showInlineDate ? (stars.width + padding / 3) : 0;
        const dateStartY = showInlineDate ? (stars.top + stars.height / 2) : (stars.top + stars.height + padding / 2);
        const dateDisplay = showInlineDate ? `- ${dateString}` : dateString;
        const date = new fabric.Textbox(dateDisplay, {
            fill: textColor,
            fontFamily,
            fontSize: containerRect.width / 29,
            textAlign: dateTextAlignment,
            left: dateStartX,
            top: dateStartY,
            width: textGroupWidth - dateStartX,
            originX: 'left', 
            originY: dateOriginY,
            opacity: 0.6
        });
        
        const textGroupItems = [verified];
        if (textBox) textGroupItems.push(textBox);
        textGroupItems.push(stars, date);
        
        var textGroup = new fabric.Group(textGroupItems, {
            originX: 'center',
            originY: 'center',
            left: centerX,
            top: centerY,
            width: textGroupWidth,
        });
        
        const textBoundingRect = textGroup.getBoundingRect();
        // Set the BG height to be a minimum of 40% of the full height
        const bgHeight = Math.max(containerRect.height * 0.3, textBoundingRect.height + padding * 2);
        var background = new fabric.Rect({
            top: textBoundingRect.top - (bgHeight / 2) + (textBoundingRect.height / 2),
            left: textBoundingRect.left - padding,
            width: textBoundingRect.width + padding * 2,
            height: bgHeight,
            fill: backgroundColor,
            rx: cornerRadius,
            ry: cornerRadius,
            shadow: "1px 1px 4px rgba(0,0,0,0.5)"
        });
        
        var group = new fabric.Group([background, textGroup], {
            originX: 'center',
            originY: 'center',
            left: centerX + animOffsetX,
            top: centerY,
        });
        
        canvas.add(group);
    }
    
    function onClose() {
        // Cleanup if you initialized anything
    }
    
    return { onRender, onClose };
}

module.exports = reviewFrameSource;