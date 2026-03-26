const { RandomForestRegression } = require('ml-random-forest');

try {
    const features = [
        [7.2, 180, 18, 150, 0.4],
        [6.8, 200, 20, 160, 0.5],
        [7.5, 220, 25, 180, 0.6]
    ];

    // Labels must be 1D array for Regression in some versions, or 2D?
    // Let's print the error if it fails
    const labels = [120, 110, 150];

    console.log("Training with:", features, labels);

    const options = {
        seed: 42,
        nEstimators: 10,
        replacement: true
    };

    const model = new RandomForestRegression(options);
    model.train(features, labels);
    console.log("Success! Model trained.");

    const prediction = model.predict([[7.2, 180, 18, 150, 0.4]]);
    console.log("Prediction:", prediction);

} catch (error) {
    console.error("DEBUG ERROR:", error);
}
