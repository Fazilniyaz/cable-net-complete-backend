export function createHubMarkerElement() {
  const hubEl = document.createElement("div");
  hubEl.innerText = "C";
  hubEl.style.width = "50px";
  hubEl.style.height = "50px";
  hubEl.style.borderRadius = "50%";
  hubEl.style.background = "black";
  hubEl.style.color = "white";
  hubEl.style.display = "flex";
  hubEl.style.alignItems = "center";
  hubEl.style.justifyContent = "center";
  hubEl.style.fontSize = "22px";
  hubEl.style.fontWeight = "900";
  hubEl.style.boxShadow = "0 0 12px rgba(0,0,0,0.8)";
  return hubEl;
}

export function createLocationMarkerElement() {
  const markerEl = document.createElement("div");
  markerEl.innerHTML = `
        <svg width="40" height="50" viewBox="0 0 40 50" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- Marker shadow -->
            <ellipse cx="20" cy="45" rx="8" ry="2" fill="rgba(0,0,0,0.2)" />
            
            <!-- Marker body -->
            <path d="M20 2C27.2 2 33 7.8 33 15C33 23.5 20 43 20 43S7 23.5 7 15C7 7.8 12.8 2 20 2Z" fill="#EF4444"/>
            
            <!-- Marker highlight -->
            <path d="M20 4C26.6 4 31 9.4 31 16C31 23 20 40 20 40S9 23 9 16C9 9.4 13.4 4 20 4Z" fill="#F87171"/>
            
            <!-- Pulse animation circle -->
            <circle cx="20" cy="18" r="5" fill="white" opacity="0.9">
                <animate attributeName="r" values="5;8;5" dur="2s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.9;0.4;0.9" dur="2s" repeatCount="indefinite"/>
            </circle>
            
            <!-- Center dot -->
            <circle cx="20" cy="18" r="2" fill="#DC2626"/>
        </svg>
    `;
  markerEl.style.cursor = "pointer";
  markerEl.className = "location-marker";
  return markerEl;
}
