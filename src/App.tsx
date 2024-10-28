// src/App.tsx
import React, { useEffect, useRef, useState } from 'react';
import './App.css'; // Import the CSS file

const GRID_ROWS = 8;
const GRID_COLS = 10;

// Define the valid coordinates matrix
const validCoordinates = [
  [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
  [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
];

// Function to pick a random valid coordinate (where value is 1)
const randomCircularCoordinate = () => {
  // Flatten the 2D array and filter for valid coordinates (where the value is 1)
  const validPositions = validCoordinates
    .map((row, rowIndex) =>
      row.map((value, colIndex) => (value === 1 ? { row: rowIndex, col: colIndex } : null))
    )
    .flat()
    .filter((coord): coord is { row: number; col: number } => coord !== null);

  // Randomly pick a valid coordinate
  return validPositions[Math.floor(Math.random() * validPositions.length)];
};

const App: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showButterfly, setShowButterfly] = useState(false);
  const [butterflyPosition, setButterflyPosition] = useState({ x: 0, y: 0 });
  const [butterflyGif, setButterflyGif] = useState<string>(""); // State to store the current butterfly GIF
  const [detectionCounts, setDetectionCounts] = useState<number[][]>(
    Array(GRID_ROWS)
      .fill(0)
      .map(() => Array(GRID_COLS).fill(0))
  );
  const [currentGridPos, setCurrentGridPos] = useState<{ row: number; col: number } | null>(null);
  const [showResults, setShowResults] = useState(false);
  const butterflyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
 
    const butterflyPool = [
    "/butterfly1.gif", // Replace with the actual path of your butterfly GIFs
    "/butterfly2.gif",
    "/butterfly3.gif",
  ];

  const butterflyAt19AppearedRef = useRef(false);
  const nextButterflyTimeRef = useRef<number | null>(null);
  const showButterflyRef = useRef(showButterfly);

  // Update the ref whenever showButterfly changes
  useEffect(() => {
    showButterflyRef.current = showButterfly;
  }, [showButterfly]);

  const updateButterflyPosition = (row: number, col: number) => {
    // Calculate actual position on the screen based on grid size
    const x = (col / GRID_COLS) * window.innerWidth;
    const y = (row / GRID_ROWS) * window.innerHeight;

    const randomButterfly = butterflyPool[Math.floor(Math.random() * butterflyPool.length)];

    setButterflyGif(randomButterfly);
    setButterflyPosition({ x, y });
    setCurrentGridPos({ row, col }); // Set the current grid position
    setShowButterfly(true);
    showButterflyRef.current = true; // Update the ref

    if (butterflyTimeoutRef.current) {
      clearTimeout(butterflyTimeoutRef.current);
    }
    butterflyTimeoutRef.current = setTimeout(() => {
      console.log('Timeout expired, hiding butterfly');
      setShowButterfly(false);
      showButterflyRef.current = false; // Update the ref
    }, 3000);
  };

  // Handle key press (spacebar detection)
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault(); // to avoid pausing/playing with the space bar
        
        if (videoRef.current) {
          videoRef.current.blur(); // remove focus
        }
        if (showButterfly && currentGridPos) {
          console.log('User saw the butterfly!');
          setShowButterfly(false); // Hide butterfly after detection

          const { row, col } = currentGridPos;
          setDetectionCounts((prevCounts) => {
            const updatedCounts = prevCounts.map((rowArr) => [...rowArr]);
            updatedCounts[row][col] += 1;
            return updatedCounts;
          });

          if (butterflyTimeoutRef.current) {
            clearTimeout(butterflyTimeoutRef.current);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [showButterfly, currentGridPos]);

  // Display butterfly at key moments
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const timeUpdateListener = () => {
        const currentTime = Math.floor(video.currentTime);

        // Show butterfly at 19 seconds only once
        if (currentTime === 19 && !butterflyAt19AppearedRef.current) {
          updateButterflyPosition(5, 5); // Butterfly appears at row 6, col 6
          butterflyAt19AppearedRef.current = true; // Prevent it from appearing again
        }

        // After 30 seconds, show butterflies at random intervals
        if (
          currentTime >= 30 &&
          !showButterflyRef.current &&
          nextButterflyTimeRef.current === null
        ) {
          const delay = Math.random() * 5000 + 2000; // Random delay between 2 to 7 seconds
          nextButterflyTimeRef.current = currentTime + delay / 1000; // Convert delay to seconds
        }

        if (nextButterflyTimeRef.current && currentTime >= nextButterflyTimeRef.current) {
          const { row, col } = randomCircularCoordinate();
          updateButterflyPosition(row, col);
          nextButterflyTimeRef.current = null; // Reset nextButterflyTime
        }
      };

      video.addEventListener('timeupdate', timeUpdateListener);
      video.addEventListener('ended', () => {
        setShowButterfly(false); // Reset state when video ends
        showButterflyRef.current = false; // Update the ref
        butterflyAt19AppearedRef.current = false; // Reset butterfly at 19 seconds for replay
        nextButterflyTimeRef.current = null; // Reset nextButterflyTime
        setShowResults(true);
      });

      return () => {
        video.removeEventListener('timeupdate', timeUpdateListener);
        if (butterflyTimeoutRef.current) {
          clearTimeout(butterflyTimeoutRef.current);
        }
      };
    }
  }, []); // Empty dependency array ensures this runs only once

  const renderResultsPage = () => {
    // Ensure shapeMask dimensions match detectionCounts dimensions
    const shapeMask = [
      [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
      [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
    ];
  
    return (
      <div className="results-page">
        <h2 className="results-title">Results</h2>
        <div className="results-grid">
          {detectionCounts.map((row, rowIndex) =>
            row.map((count, colIndex) => {
              // Ensure indices are within the shapeMask bounds
              const isInMaskBounds =
                rowIndex < shapeMask.length && colIndex < shapeMask[0].length;
              const isValidCoordinate =
                isInMaskBounds && shapeMask[rowIndex][colIndex] === 1;
  
              return (
                <div
                  key={`cell-${rowIndex}-${colIndex}`}
                  className="results-cell"
                  style={{
                    visibility: isValidCoordinate ? 'visible' : 'hidden',
                    backgroundColor: isValidCoordinate
                      ? `rgba(0, 0, 0, ${1 - Math.min(count / 2, 1)})`
                      : 'transparent',
                    border: isValidCoordinate ? '1px solid black' : 'none',
                  }}
                >
                  {/* {isValidCoordinate && count > 0 ? count : ''} */}
                </div>
              );
            })
          )}
         {/* Axes divs */}
        <div className="horizontal-axis"></div>
        <div className="vertical-axis"></div>
        
        </div>
        {/* Color legend */}
      <div className="color-legend">
        <div className="legend-title">Detection Counts</div>
        <div className="legend-scale">
          <div className="legend-color low"></div>
          <div className="legend-color mid"></div>
          <div className="legend-color high"></div>
        </div>
        <div className="legend-labels">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>
      </div>
    );
  };

  return (
    <div className="app">
      {!showResults ? (
        <>
          <video
            ref={videoRef}
            className="full-screen-video"
            controls
          >
            <source src="/output.mp4" type="video/mp4" />
            Your browser does not support the video tag.

            {/* https://drive.google.com/file/d/11D60URX5wxW2Jo4WkRNVK9HMzjHsPl0n/view?usp=sharing

            11D60URX5wxW2Jo4WkRNVK9HMzjHsPl0n */}
          </video>
          {/* <video ref={videoRef} className="full-screen-video" preload="auto" controls>
            <source src="https://drive.google.com/uc?id=11D60URX5wxW2Jo4WkRNVK9HMzjHsPl0n&export=download" type="video/mp4" />
            Your browser does not support the video tag.
          </video> */}
          <div className="grid-overlay">
            {/* Add grid lines dynamically */}
            {/* {[...Array(GRID_COLS)].map((_, i) => (
              <div key={`vertical-${i}`} className="grid-line vertical" style={{ left: `${(i / GRID_COLS) * 100}%` }}></div>
            ))}
            {[...Array(GRID_ROWS)].map((_, i) => (
              <div key={`horizontal-${i}`} className="grid-line horizontal" style={{ top: `${(i / GRID_ROWS) * 100}%` }}></div>
            ))} */}
          </div>
          {showButterfly && (
            <img
              src={butterflyGif}
              alt="Butterfly"
              className="butterfly"
              style={{
                top: `${butterflyPosition.y}px`,
                left: `${butterflyPosition.x}px`,
              }}
            />
          )}
        </>
      ) : (
        renderResultsPage()
      )}
    </div>
  );
};

export default App;
