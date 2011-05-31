(function( Factlink ) {
var results = [],
    // Function which walks the DOM in HTML source order
    // as long as func does not return false
    // Inspiration: Douglas Crockford, JavaScript: the good parts
    walkTheDOM = function walk(node, func) {
        if ( func(node) !== false ) {
            node = node.firstChild;
            while (node) {
                if (walk(node, func) !== false) {
                    node = node.nextSibling;
                } else {
                    return false;
                }
            }
        } else {
            return false;
        }
    },
    // Regex for class find
    re = /(^|\s)factlink(\s|$)/;
    
// Function to select the found ranges
Factlink.selectRanges = function(ranges, id){
    var i, k, len;
    // Loop through ranges (backwards)
    for ( i = ranges.length; i--; ){
        // Current range
        var range = ranges[i],
        
            // Start- and EndNodes
            startNode = range.startContainer,
            endNode = range.endContainer,

            // Try to find out if there are other matches within this element
            j = i,
            // Helper for posible extra matches within the current startNode
            extraMatches = [],
            
            obj;
            
        // Check if the given factlink is not already selected 
        // (fixes multiple check marks when editing a factlink)
        if ( re.test( startNode.parentNode.className ) ) {
            continue;
        }
        
        while ( --j > 0 && ranges[j].startContainer === startNode ) {
            // Push the match to the extraMatches helper
            extraMatches.push({
                'startOffset' : ranges[j].startOffset,
                'endOffset' : ranges[j].endOffset
            });

            // decrease the increment so this element 
            // won't be matched in the next loop
            --i;
        }
                
        // Insert the actual span
        this.replaceFactNodes(range.startOffset, 
                         range.endOffset, 
                         startNode, 
                         endNode, 
                         range.commonAncestorContainer);
        
        // If there are other matches within the startNode, 
        // process them here
        if ( extraMatches.length > 0 ) {
            for ( k = 0; k < extraMatches.length; k++ ) {
                obj = extraMatches[k];

                // Insert the "fact"-span in the same element
                this.replaceFactNodes(obj.startOffset, 
                                      obj.endOffset, 
                                      startNode, 
                                      endNode, 
                                      range.commonAncestorContainer );
            }
        }
    }
    
    // This is where the actual parsing takes place
    // this.results holds all the textNodes containing the facts
    for ( i = 0, len = results.length; i < len; i++ ) {
        var res = results[i];
        
        // Insert the fact-span
        insertFactSpan(
            res.startOffset, 
            res.endOffset, 
            res.node, 
            id, 
            // Only select the first range of every matched string
            // Needed for when one displayString is matched mutliple times on 
            // one page
            i % ( results.length / ranges.length ) === 0
        );
    }
    
    // Empty the results placeholder so that results don't stack
    results = [];
};

// This is where the actual magic will take place
// A Span will be inserted around the startOffset/endOffset 
// in the startNode/endNode
var insertFactSpan = function(startOffset, endOffset, node, id, isFirst ) {
        // Value of the startNode, represented in an array
    var startNodeValue = node.nodeValue.split(''),
        // The selected text
        selTextStart = startNodeValue
                                .splice(startOffset, startNodeValue.length);
    
    if ( endOffset < node.nodeValue.length && endOffset !== 0 ) {
        var after = selTextStart
                        .splice(endOffset - startOffset , selTextStart.length)
                        .join('');

        // Slice the array by changing it's length
        selTextStart.length = endOffset - startOffset;

        // Insert the textnode with the remaining text after the 
        // current textNode
        node.parentNode
            .insertBefore( document.createTextNode(after), node.nextSibling );
    }
        // Create a reference to the actual "fact"-span
    var span = createFactSpan( selTextStart.join(''), id );

    // Remove the last part of the nodeValue
    node.nodeValue = startNodeValue.join('');
    
    // Insert the span right after the startNode 
    // (there is no insertAfter available)
    node.parentNode.insertBefore( span, node.nextSibling );
    
    // If this span is the first in a range of fact-spans
    if ( isFirst ) {
        var first = createFactSpan( "", id, true );
        first.innerHTML = "&#10003;";
        
        node.parentNode.insertBefore( first, span );
    }
},

// Create a "fact"-span with the right attributes
createFactSpan = function(text, id, first){
    var span = document.createElement('span');

    // Set the span attributes
    span.className = "factlink";
    
    if ( first === true ) {
        span.className += " fl-first";
    }
    
    span.setAttribute('data-factid',id);
        
    // IE Doesn't support the standard (textContent) and Firefox doesn't 
    // support innerText
    if ( document.getElementsByTagName("body")[0].innerText === undefined ) {
        span.textContent = text;
    } else {
        span.innerText = text;
    }
    
    return span;
};

// Function that tracks the DOM for nodes containing the fact
Factlink.replaceFactNodes = function(startOffset,
                                     endOffset,
                                     startNode,
                                     endNode,
                                     commonAncestorContainer) {
        // Only parse the nodes if the startNode is already found, 
        // this boolean is used for tracking
    var foundStart = false;
    
    // Walk the DOM in the right order and call the function for every 
    // node it passes
   walkTheDOM( commonAncestorContainer, function( node ) {
        // We're only interested in textNodes
        if ( node !== undefined && node.nodeType === 3 ){
            var rStartOffset = 0;
            if (node === startNode) {
                foundStart = true;
                rStartOffset = startOffset;
            }

            if (foundStart) {
                var rEndOffset = node.nodeValue.length;
                if (node === endNode) {
                    rEndOffset = endOffset;
                }
                
                // Push the right info to the results array, the info 
                // is being parsed later (selectRanges -end)
                results.push({
                    startOffset: rStartOffset,
                    endOffset: rEndOffset,
                    node: node
                });
            }

            if (foundStart && node === endNode) {
                // If we encountered the last node we don't 
                // need to walk the DOM anymore
                return false;
            }
        }
    });
};
})( window.Factlink );