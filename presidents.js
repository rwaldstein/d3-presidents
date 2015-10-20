// a generic tree but if lots of leaves does multiple rows of children
var treeRoot;
var margin = {
    top: 15,
    right: 8,

    bottom: 5,
    left: 10
},
width = window.innerWidth - margin.right - margin.left,
height = window.innerHeight - margin.top - margin.bottom,
middle = width / 2;

// the tree leaf (info nodes) are  140x60  (rectW x rectH)
var i = 0,
    duration = 750,
    rectW = 140,
    rectH = 60,
    rowHeight = rectH + rectH/2;

var tree = d3.layout.tree();
var diagonal = d3.svg.diagonal()
    .projection(function (d) {
    return [d.x + rectW / 2, d.y + rectH / 2];
});

var svg = d3.select("#body").append("svg").attr("width", "100%").attr("height", "100%")
    .call(zm = d3.behavior.zoom().scaleExtent([1,3]).on("zoom", redraw)).append("g")
    .attr("transform", "translate(" + middle + "," + 20 + ")");

//necessary so that zoom knows where to zoom and unzoom from
zm.translate([middle, 20]);

function collapse(d) {
    if (d.children) {
        if (! d._children) { d._children = d.children; }
        d._children.forEach(collapse);
	d.children = null;
	}
 }


d3.select("#body").style("height", window.innerHeight + "px");

function showTOP(data) {
    treeRoot = data;

    treeRoot.x0 = 0;
    treeRoot.y0 = height / 2;

    treeRoot.children.forEach(collapse);
    update(treeRoot);
    }

function update(source) {

    // Compute the new tree layout.
    var nodes = tree.nodes(treeRoot).reverse(),
        links = tree.links(nodes);

    // figure out how many on line and related aspects
    var maxNodes = Math.floor(width / rectW);

    // Normalize for fixed-depth.
    nodes.forEach(function (d) {

	var numrow = 1;
	if (d.children != null) { numrow = Math.floor((d.children.length + maxNodes - 1) / maxNodes); }
	if (d.children != null && d.children.length > maxNodes) {
		d.children.forEach(function (d, i) {
		var Mrows = d.depth;
		d.y = (Mrows + i % numrow) * rowHeight;
		var rowpos = Math.floor(i/numrow);
		d.x =  d.parent.x - maxNodes*rectW/2 + rowpos*rectW;
		d.numberRows = numrow + Mrows;
		});
	    }
	if (d.parent != null) {
	    d.x =  d.parent.x - (d.parent.children.length-1)*rectW/2 + (d.parent.children.indexOf(d))*rectW;
	    var Mrows = d.depth;
	    // if (d.parent.numberRows != null) { Mrows = d.parent.numberRows; }
	    d.y = Mrows * rowHeight;
	    d.numberRows = 1 + Mrows;
	    }
    });

    // Update the nodes
    var node = svg.selectAll("g.node")
        .data(nodes, function (d) {
        return d.id || (d.id = ++i);
    });

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .attr("transform", function (d) {
        return "translate(" + source.x0 + "," + source.y0 + ")"
    })
	;

    nodeEnter.append("rect")
        .attr("width", rectW)
        .attr("height", rectH - 10)
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .style("fill", function (d) {
        return d._children ? "lightsteelblue" : "#fff";
    });

    nodeEnter.append("foreignObject")
        .attr("width", rectW)
        .attr("height", rectH)
        .append("xhtml:div")
        .html(function (d) {
	    var ans = "<table><tr><td>";
	    if (d.picture != null) {
		ans += "<img src=\"" + d.picture + "\" style=\"width:40px;\">";
		}
	    ans += "</td>";
	    ans += "<td style=\"font-size: 70%\" ><b>" + d.name + "</b><br>" + d.title + "<br>";
	    ans += "</td> </tr> </table>";
	    return ans;
	})
	.on("click",function (d) { childWin(d.url) })
	;

    // this places the up/down arrow (15x25 is arrow image size), centered horizontally on the info box, slightly (3 px) below
    node.append("image")
	.attr("xlink:href", function(d) { if (d.children != null) { return "uparrow.gif"; } else if (d._children != null) { return "downarrow.gif"; } else return " "; })
	.attr("width", 15)
	.attr("height", 25)
	.attr("x", rectW/2)
	.attr("y", rectH-3)
	.on('click', click);


    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
        .duration(duration)
        .attr("transform", function (d) {
        return "translate(" + d.x + "," + d.y + ")";
    });

    nodeUpdate.select("rect")
        .attr("width", rectW)
        .attr("height", rectH)
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .style("fill", function (d) {
        return d._children ? "lightsteelblue" : "#fff";
    });

    nodeUpdate.select("text")
        .style("fill-opacity", 1);

    // Transition exiting nodes to the parent's new position.
    var nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function (d) {
        return "translate(" + source.x + "," + source.y + ")";
    })
        .remove();

    nodeExit.select("rect")
        .attr("width", rectW)
        .attr("height", rectH)
    //.attr("width", bbox.getBBox().width)""
    //.attr("height", bbox.getBBox().height)
    .attr("stroke", "black")
        .attr("stroke-width", 1);

    nodeExit.select("text");

    // Update the links
    var link = svg.selectAll("path.link")
        .data(links, function (d) {
        return d.target.id;
    });

    // Enter any new links at the parent's previous position.
    link.enter().insert("path", "g")
        .attr("class", "link")
        .attr("x", rectW / 2)
        .attr("y", rectH / 2)
        .attr("d", function (d) {
        var o = {
            x: source.x0,
            y: source.y0
        };
        return diagonal({
            source: o,
            target: o
        });
    });

    // Transition links to their new position.
    link.transition()
        .duration(duration)
        .attr("d", diagonal);

    // Transition exiting nodes to the parent's new position.
    link.exit().transition()
        .duration(duration)
        .attr("d", function (d) {
        var o = {
            x: source.x,
            y: source.y
        };
        return diagonal({
            source: o,
            target: o
        });
    })
        .remove();

    // Stash the old positions for transition.
    nodes.forEach(function (d) {
        d.x0 = d.x;
        d.y0 = d.y;
    });
}

// Toggle children on click.
function click(d) {
    if (d.children) {
        if (! d._children) { d._children = d.children; }
        d.children = null;
    } else {
        d.children = d._children;
        d._children = null;
	}
    // If the node has a parent, then collapse its child nodes
    // except for this clicked node.
    if (d.parent) {
	d.parent.children.forEach(function(element) {
	if (d !== element) {
	    collapse(element);
	    }
	  });
	if (d.parent._children) {
	    d.parent.children = d.parent._children;
	    d.parent._children = null;
	    }
	else if (d.parent.children.length > 1) {
	    d.parent._children = d.parent.children;
	    d.parent.children = [d];
	    }
    }
    update(d);
    }

//Redraw for zoom
function redraw() {
  //console.log("here", d3.event.translate, d3.event.scale);
  svg.attr("transform",
      "translate(" + d3.event.translate + ")"
      + " scale(" + d3.event.scale + ")");
}

function childWin( url) {
	if (url != null) {
	    window.open(url,'width=600,height=300');
	    }
	}

