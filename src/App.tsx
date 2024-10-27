// src/App.tsx
import React, { useEffect, useRef, useState } from 'react';
import './App.css'; // Import the CSS file



const GRID_SIZE = 10; 
const CENTER = Math.floor(GRID_SIZE / 2);
const RADIUS = GRID_SIZE / 2; // Adjust this to control the size of the circle


const validCircularCoordinates = Array.from({ length: GRID_SIZE }, (_, row) =>
  Array.from({ length: GRID_SIZE }, (_, col) => {
    const distanceFromCenter = Math.sqrt((row - CENTER) ** 2 + (col - CENTER) ** 2);
    return distanceFromCenter <= RADIUS ? { row, col } : null;
  })
)
  .flat()
  .filter((coord): coord is { row: number; col: number } => coord !== null);

  

// Function to pick a random valid coordinate within the circular region
const randomCircularCoordinate = () => {
  return validCircularCoordinates[
    Math.floor(Math.random() * validCircularCoordinates.length)
  ];
};

const App: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showButterfly, setShowButterfly] = useState(false);
  const [butterflyPosition, setButterflyPosition] = useState({ x: 0, y: 0 });
  const [detectionCounts, setDetectionCounts] = useState<number[][]>(
    Array(GRID_SIZE)
      .fill(0)
      .map(() => Array(GRID_SIZE).fill(0))
  );
  const [currentGridPos, setCurrentGridPos] = useState<{ row: number; col: number } | null>(null);
  const [showResults, setShowResults] = useState(false);
  const butterflyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  const updateButterflyPosition = () => {
    const { row, col } = randomCircularCoordinate();
    setCurrentGridPos({ row, col });

    // Calculate actual position on the screen based on grid size
    const x = (col / GRID_SIZE) * window.innerWidth;
    const y = (row / GRID_SIZE) * window.innerHeight;

    setButterflyPosition({ x, y });
    setShowButterfly(true);

    if (butterflyTimeoutRef.current) {
      clearTimeout(butterflyTimeoutRef.current);
    }
    butterflyTimeoutRef.current = setTimeout(() => {
      setShowButterfly(false);
    }, 5000);
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
      const keyMoments = Array.from({ length: 15 }, () => Math.floor(Math.random() * Math.floor(video.duration)));
      
      const timeUpdateListener = () => {
        if (keyMoments.includes(Math.floor(video.currentTime)) && !showButterfly) {
          updateButterflyPosition();
        }
      };
      
      video.addEventListener('timeupdate', timeUpdateListener);
      video.addEventListener('ended', () => setShowResults(true));

      // Set an interval to make the butterfly appear more frequently
      const butterflyInterval = setInterval(() => {
        if (!showButterfly) {
          updateButterflyPosition();
        }
      }, 5000); // Butterfly appears every 5 seconds

      return () => {
        video.removeEventListener('timeupdate', timeUpdateListener);
        clearInterval(butterflyInterval);
        if (butterflyTimeoutRef.current) {
          clearTimeout(butterflyTimeoutRef.current);
        }
      };
    }
  }, []);

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
                      ? `rgba(0, 0, 0, ${Math.min(count / 10, 1)})`
                      : 'transparent',
                    border: isValidCoordinate ? '1px solid black' : 'none',
                  }}
                >
                  {isValidCoordinate && count > 0 ? count : ''}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="app">
      {!showResults ? (
        <>
          <video ref={videoRef} className="full-screen-video" controls>
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
            {[...Array(GRID_SIZE)].map((_, i) => (
              <div key={`vertical-${i}`} className="grid-line vertical" style={{ left: `${i * 10}%` }}></div>
            ))}
            {[...Array(GRID_SIZE)].map((_, i) => (
              <div key={`horizontal-${i}`} className="grid-line horizontal" style={{ top: `${i * 10}%` }}></div>
            ))}
          </div>
          {showButterfly && (
            <img
              src="butterfly.gif"
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
