document.addEventListener("DOMContentLoaded", () => {
    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", 800)
        .attr("height", 400);

    // Exemple : Créer un cercle
    svg.append("circle")
        .attr("cx", 100)
        .attr("cy", 100)
        .attr("r", 50)
        .attr("fill", "blue");
});
