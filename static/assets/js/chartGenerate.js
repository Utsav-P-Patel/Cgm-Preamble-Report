// FIXME
//  Get upper limit and lower limit for horizontal line
//  Get the color and text formatting information.
//  The data should be clean and preprocessed or the chart will break.

// FIXME Page size options
//  1 - Fully Dynamic (fix width variable height as per the data)(bad for print)
//  2 - Semi Dynamic(fix width fix minimum height after that variable height for more data)(bad for print)
//  3 = Fix Page size(fix width and height of page. extra data in new page)(ideal for print)
//  Implemented 2nd.

// FIXME
//  Adjust ideal chart height for optimal rows and chart visibility.

let totalGlucoseData = [];
let totalGlucoseSpikes = 0;
let timeInRange = 0;

let totalCalories = 0;
let totalProtein = 0;
let totalCarbohydrates = 0;
let totalFats = 0;
let totalDays = 0;


// // Load and Process Data
async function generateChart(glucoseData, mealData, min, max, date, index, upperLimit, lowerLimit) {
    totalDays += 1;

    const containerWidth = parseInt(d3.select(".main-container").style("width"));
    const margin = { top: 70, right: 30, bottom: 60, left: 80 };
    const width = containerWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Set up the x and y scales
    const x = d3.scaleTime()
        .range([0, width]);

    const y = d3.scaleLinear()
        .range([height, 0]);

    // Create the SVG element and append it to the chart container
    const svg = d3.select(`#chart${index}`)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // console.log(data);
    const format = d3.timeParse("%m/%d/%Y %H:%M");

    let maxGlucose = max.maxGlucose;
    let minGlucose = min.minGlucose;
    let maxGlucoseTime = max.maxGlucoseTime;
    let minGlucoseTime = min.minGlucoseTime;

    let timeSpan = d3.extent(glucoseData, d => d.datetime);
    let hoursDifference = d3.timeHour.count(timeSpan[0], timeSpan[1]);
    // TODO: set this limit as required for dynamic x ticks.
    //  to avoid congestion on x axis.
    let limit = 15;
    let result = hoursDifference < limit ? 1 : 2;

    x.domain(d3.extent(glucoseData, d => d.datetime));

    let maxY = d3.max(glucoseData, d => d.glucose);
    maxY = maxY > (upperLimit+20)? maxY: upperLimit+20;
    y.domain([0, maxY]);

    let xTicksValues = () => {
        let ticks = x.ticks(d3.timeHour.every(result));

        if (ticks[0] > x.domain()[0]) {
            ticks.unshift(x.domain()[0]);
        }
        if (ticks[ticks.length - 1] < x.domain()[1]) {
            ticks.push(x.domain()[1]);
        }
        if(ticks.length < 1) {
            ticks.push(x.domain()[0]);
            ticks.push(x.domain()[1]);
        }
        if (ticks.length > 1 && (ticks[1] - ticks[0]) < (60 * 60 * 1000)) {
            ticks.shift();
        }
        if (ticks.length > 1 && (ticks[ticks.length - 1] - ticks[ticks.length - 2]) < (60 * 60 * 1000)) {
            ticks.splice(ticks.length - 1, 1);
        }
        return ticks;
    }
    // Add the x-axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .style("font-size", "14px")
        .call(d3.axisBottom(x)
            .tickValues(xTicksValues())
            .tickFormat(d3.timeFormat("%I:%M %p")))
        .call(g => g.select(".domain").remove())
        .selectAll(".tick line")
        .style("stroke-opacity", 0)
        .style("font-family", "sans-serif")
    svg.selectAll(".tick text")
        .attr("fill", "#777");


    const tickValues = [];
    for (let i = 0; i <= maxY; i += 20) {
        tickValues.push(i);
    }
    // Add the y-axis
    svg.append("g")
        .style("font-size", "14px")
        .call(d3.axisLeft(y)
            .tickValues(tickValues)
            .tickSize(0)
            .tickPadding(10))
        .call(g => g.select(".domain").remove())
        .selectAll(".tick text")
        .style("fill", "#777")
        .style("font-family", "sans-serif")
        .style("visibility", (d, i, nodes) => {
            if (i === 0) {
                return "hidden";
            } else {
                return "visible";
            }
        });

    // Add vertical gridlines
    // svg.selectAll("xGrid")
    //     .data(x.ticks().slice(1))
    //     .join("line")
    //     .attr("x1", d => x(d))
    //     .attr("x2", d => x(d))
    //     .attr("y1", 0)
    //     .attr("y2", height)
    //     .attr("stroke", "#e0e0e0")
    //     .attr("stroke-width", .5);

// // Add horizontal gridlines
    svg.selectAll("yGrid")
        .data(y.ticks().slice(1))
        .join("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", d => y(d))
        .attr("y2", d => y(d))
        .attr("stroke", "#e0e0e0")
        .attr("stroke-width", .5);


    // Append a horizontal line at y=145
    let upperGlucoseLimit = upperLimit;
    svg.append("line")
        .attr("x1", 0)
        .attr("y1", y(upperGlucoseLimit))
        .attr("x2", width)
        .attr("y2", y(upperGlucoseLimit))
        .attr("stroke", "black")
        .attr("stroke", "#555555")
        .attr("stroke-width", .6)
        .attr("stroke-dasharray", "5,5");


// Append a label on top of the line on the left side
    svg.append("text")
        .attr("x", width)
        .attr("y", y(upperGlucoseLimit))
        .attr("dy", "-0.7em") // Offset the text position slightly above the line
        .attr("dx", "-0.5em") // Offset the text position slightly to the left
        .style("text-anchor", "end")
        .style("font-size", "14px")
        .style("fill", "#777")
        .style("font-family", "sans-serif") // sans-serif
        .text("Upper limit ");

    // Append a horizontal line at y=100
    let lowerGlucoseLimit = lowerLimit;
    svg.append("line")
        .attr("x1", 0)
        .attr("y1", y(lowerGlucoseLimit))
        .attr("x2", width)
        .attr("y2", y(lowerGlucoseLimit))
        .attr("stroke", "#555555")
        .attr("stroke-width", .6)
        .attr("stroke-dasharray", "5,5");


// Append a label on top of the line on the left side
    svg.append("text")
        .attr("x", width)
        .attr("y", y(lowerGlucoseLimit))
        .attr("dy", "1.4em") // Offset the text position slightly above the line
        .attr("dx", "-0.5em") // Offset the text position slightly to the left
        .style("text-anchor", "end")
        .style("font-size", "14px")
        .style("fill", "#777")
        .style("font-family", "sans-serif") // sans-serif
        .text("Lower limit");


    // Create the line generator
    const line = d3.line()
        .x(d => x(d.datetime))
        .y(d => y(d.glucose));

    // Add the line path to the SVG element
    // Color: steelblue
    svg.append("path")
        .datum(glucoseData)
        .attr("fill", "none")
        .attr("stroke", "#2980b1")
        .attr("stroke-width", 2)
        .attr("d", line);


    for(let i = 0; i < glucoseData.length; i++) {
        let upperPolygonPoints = [];
        let lowerPolygonPoints = [];

        if(glucoseData[i].glucose >= upperLimit) {
            const initialIndex = i;
            upperPolygonPoints.push(`${x(glucoseData[i].datetime)},${y(upperLimit)}`);
            while(i < glucoseData.length && glucoseData[i].glucose >= upperLimit) {
                upperPolygonPoints.push(`${x(glucoseData[i].datetime)},${y(glucoseData[i].glucose)}`);
                i++;
            }
            upperPolygonPoints.push(`${x(glucoseData[i-1].datetime)},${y(upperLimit)}`);
            upperPolygonPoints.push(`${x(glucoseData[initialIndex].datetime)},${y(upperLimit)}`);
            svg.append("polygon")
                .attr("points", upperPolygonPoints.join(" "))
                .attr("fill", "#ff6748")
                .attr("opacity", 0.5);
        }

        if(i < glucoseData.length && glucoseData[i].glucose <= lowerLimit) {
            const initialIndex = i;
            lowerPolygonPoints.push(`${x(glucoseData[i].datetime)},${y(lowerLimit)}`);
            while(i < glucoseData.length && glucoseData[i].glucose <= lowerLimit) {
                lowerPolygonPoints.push(`${x(glucoseData[i].datetime)},${y(glucoseData[i].glucose)}`);
                i++;
            }
            lowerPolygonPoints.push(`${x(glucoseData[i-1].datetime)},${y(lowerLimit)}`);
            lowerPolygonPoints.push(`${x(glucoseData[initialIndex].datetime)},${y(lowerLimit)}`);
            svg.append("polygon")
                .attr("points", lowerPolygonPoints.join(" "))
                .attr("fill", "#ffba83")
                .attr("opacity", 0.5);
        }
    }


// Dot at the max and min of glucose level
    svg.append("circle")
        .attr("cx", x(maxGlucoseTime))
        .attr("cy", y(maxGlucose))
        .attr("r", 3)
        .attr("fill", "lightblue")
        .attr("stroke", "darkblue")
        .attr("stroke-width", 1);

    svg.append("text")
        .attr("x", x(maxGlucoseTime))
        .attr("y", y(maxGlucose))
        .attr("dy", "-1em")
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .attr("fill", "#333333")
        .style("font-family", "sans-serif") // sans-serif
        .attr("font-weight", "500")
        .text(maxGlucose);

    svg.append("circle")
        .attr("cx", x(minGlucoseTime))
        .attr("cy", y(minGlucose))
        .attr("r", 3)
        .attr("fill", "lightblue")
        .attr("stroke", "darkblue")
        .attr("stroke-width", 1);

    svg.append("text")
        .attr("x", x(minGlucoseTime))
        .attr("y", y(minGlucose))
        .attr("dy", "+1.7em")
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .attr("fill", "#333333")
        .style("font-family", "sans-serif") // sans-serif
        .attr("font-weight", "500")
        .text(minGlucose);


    // Add Y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left + 20)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .style("fill", "#777")
        .style("font-family", "sans-serif") // sans-serif
        .text("Blood Glucose (mg/dL)");


    // Add X-axis label
    svg.append("text")
        .attr("y", height + margin.bottom - 2)
        .attr("x", width/2)
        .attr("dx", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .style("fill", "#777")
        .style("font-family", "sans-serif") // sans-serif
        .text(`Time [${date}]`);

    // Add the chart title
    svg.append("text")
        .attr("class", "chart-title")
        .attr("x", margin.left - 115)
        .attr("y", margin.top - 100)
        .style("font-size", "20px")
        .style("font-weight", "400")
        .style("font-family", "sans-serif") // sans-serif
        .text(`Day ${index+1}`);

    await getStats(glucoseData, upperLimit, lowerLimit);
    await populateTable(svg, mealData, index, x, y, glucoseData, minGlucose);
}

async function populateTable(svg, mealData, index, x, y, glucoseData, minGlucose) {
    const interpolateY = (datetime) => {
        const xValue = x(datetime); // Assuming xScale is defined and represents your datetime scale
        const bisectDate = d3.bisector(d => d.datetime).left;
        const index = bisectDate(glucoseData, datetime, 1);
        const d0 = glucoseData[index - 1];
        const d1 = glucoseData[index];

        // Check if d0 or d1 is undefined (outside the range of data)
        if (!d0 || !d1) {
            return null; // Return null if datetime is outside the range of data
        }
        // Calculate interpolated y-value
        const interpolatedY = d3.interpolateNumber(d0.glucose, d1.glucose)((x(datetime) - x(d0.datetime)) / (x(d1.datetime) - x(d0.datetime)));
        // console.log(interpolatedY);
        return y(interpolatedY);
    };

    let table = $(`#table${index} table tbody`);
    let footEnergy = 0;
    let footProtein = 0;
    let footCarbs = 0;
    let footFats = 0;
    let footMeals = 0;

    // console.log(mealData, index);
    try {

        if(mealData) {
            let prevDate = undefined;
            let prevLabel = undefined;
            mealData.forEach((data, index) => {
                let verticalLineDate = new Date(data.timestamp);

                if (verticalLineDate >= x.domain()[0] && verticalLineDate <= x.domain()[1]) {
                    let verticalLineX = x(verticalLineDate);
                    let interpolatedYValue = interpolateY(verticalLineDate);
                    let label = String.fromCharCode(65 + index);
                    let tableLabel = label;
                    if(prevDate?.getTime() === verticalLineDate?.getTime()) {
                        label = prevLabel + ", " + label;
                    }

                    // FIXME: Set value as required by client for y1 (hanging labels position)
                    //  Earlier Value: .attr("y1", interpolatedYValue + 100)
                    svg.append("line")
                        .attr("x1", verticalLineX)
                        .attr("y1", y(20))
                        .attr("x2", verticalLineX)
                        .attr("y2", interpolatedYValue)
                        .attr("stroke", "#333333")
                        .attr("stroke-width", .8);

                    const text = svg.append("text")
                        .attr("x", verticalLineX)
                        .attr("y", y(20))
                        .attr("dy", "-0.3em")
                        .attr("dx", "0em")
                        .attr("text-anchor", "middle")
                        .style("font-size", "16px")
                        .style("font-family", "sans-serif") // sans-serif Rules
                        .attr("font-weight", "500")
                        .attr("transform", `rotate(0, ${verticalLineX}, ${y(20)})`)
                        .text(label);


                    svg.append("circle")
                        .attr("cx", verticalLineX)
                        .attr("cy", interpolatedYValue)
                        .attr("r", 3)
                        .attr("fill", "lightblue")
                        .attr("stroke", "darkblue")
                        .attr("stroke-width", 1);

                    // Get the bounding box of the text element
                    const bbox = text.node().getBBox();

                    // Append a rectangle behind the text for the background
                    svg.append("rect")
                        .attr("x", bbox.x - 3)
                        .attr("y", bbox.y - 3)
                        .attr("width", bbox.width + 6)
                        .attr("height", bbox.height + 6)
                        .attr("fill", "#f0f0f0")
                        .attr("stroke", "none")
                        .attr("rx", 4)
                        .attr("ry", 4);

                    // Re-append the text to ensure it is on top of the rectangle
                    text.raise();

                    const formattedTime = verticalLineDate.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                    });

                    let row = `<tr>
                                    <td>${tableLabel}</td>
                                    <td>${formattedTime}</td>
                                    <td>${data.name}</td>
                                    <td>${Object.keys(data.data).join(', ')}</td>
                                    <td>${(data.energy.value).toFixed(0)}</td>
                                    <td>${(data.macros.protein).toFixed(0)}</td>
                                    <td>${(data.macros.carbs).toFixed(0)}</td>
                                    <td>${(data.macros.fats.total).toFixed(0)}</td>
                                </tr>`;
                    table.append(row);

                    try {
                        totalCalories += parseFloat(data.energy.value);
                        totalProtein += parseFloat(data.macros.protein);
                        totalCarbohydrates += parseFloat(data.macros.carbs);
                        totalFats += parseFloat(data.macros.fats.total);

                        footEnergy += parseFloat(data.energy.value);
                        footProtein += parseFloat(data.macros.protein);
                        footCarbs += parseFloat(data.macros.carbs);
                        footFats += parseFloat(data.macros.fats.total);
                        footMeals++;
                    } catch (error) {
                        $('#alertContainer').html('<div class="alert alert-danger" role="alert">Error processing nutritional data.</div>');
                        console.error("Error parsing data:", error);
                    }

                    prevLabel = label;
                    prevDate = verticalLineDate;
                }
            });
        }
        let tableFoot = $(`#table${index} table tfoot`);
        let footRow = `<tr>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td><b style="text-align: right; display: block;">Total</b></td>
                                <td><b>${footEnergy.toFixed(0)}</b></td>
                                <td><b>${footProtein.toFixed(0)}</b></td>
                                <td><b>${footCarbs.toFixed(0)}</b></td>
                                <td><b>${footFats.toFixed(0)}</b></td>
                            </tr>`;
        tableFoot.append(footRow);
    } catch (error) {
        console.error(error.stack);
        $('#alertContainer').html('<div class="alert alert-danger" role="alert">Error processing meal data.</div>');
    }

    // TODO: If client says, decrement days here.
    //     Since if there is no meal data for some day, no need to count that day.
    if (table.find('tr').length === 0)  {   table.closest('div').remove();}
}


async function getStats(glucoseData, upperLimit, lowerLimit) {
//    console.log("test")
//    console.log(JSON.stringify(glucoseData))
    try {
        totalGlucoseData = totalGlucoseData.concat(glucoseData);

//        timeInRange

        let counter = 0;
        let i = 0;

//        while (i < glucoseData.length) {
//            const currentEntry = glucoseData[i];
//            const currentDateTime = new Date(currentEntry.datetime);
//
//            if (currentEntry.glucose > upperLimit) {
//                counter++;
//                const skipUntil = new Date(currentDateTime.getTime() + 30 * 60000);
//                while (i < glucoseData.length && new Date(glucoseData[i].datetime) <= skipUntil) {
//                    if (glucoseData[i].glucose <= upperLimit) {
//                        // glucoseData[i].glucose >= lowerLimit &&
//                        timeInRange++;
//                    }
//                    i++;
//                }
//            } else {
//                // Lower limit not needed for time in range.
//                // So commented and directly incrented counter.
//                // if (currentEntry.glucose >= lowerLimit) {
//                //     timeInRange++;
//                // }
//                timeInRange++;
//                i++;
//            }
//        }
//Spikes ma upper limit and lower limit ni bahar jay etle spike ganay....
//Time in range ma upper limit thi niche vado badho time ganay

//The spikes over 145 calculation only considers data above the upper limit of 145
// Time in range is the % of data points <145. So yes points below the lower limit are considered to be "in range" for this purpose.
        while (i < glucoseData.length) {
            const currentEntry = glucoseData[i];
            const currentDateTime = new Date(currentEntry.datetime);

//            console.log(currentEntry.glucose);

            if (currentEntry.glucose > upperLimit) {
                counter++;

                if(currentEntry.glucose <= upperLimit) {timeInRange++;}
                i++;
                const skipUntil = new Date(currentDateTime.getTime() + 30 * 60000);
                while (i < glucoseData.length && new Date(glucoseData[i].datetime) <= skipUntil) {
                    if (glucoseData[i].glucose <= upperLimit) {
                        timeInRange++;
                    }
                    i++;
                }
            } else {
                timeInRange++;
                i++;
            }
        }
        totalGlucoseSpikes += counter;
    } catch (e) {
        $('#alertContainer').html('<div class="alert alert-danger" role="alert">Error processing glucose data.</div>');
    }
}
