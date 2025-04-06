
// FarmWise - Farmer Advisory System
// Main application JavaScript

// =========================================
// Router and Navigation
// =========================================
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initRouter();
    setupMobileMenu();
    setupEventListeners();
  });
  
  function initRouter() {
    // Client-side router
    function navigateTo(hash) {
      // Hide all views
      const views = document.querySelectorAll('.view');
      views.forEach(view => view.classList.remove('active'));
      
      // Deactivate all nav links
      const navLinks = document.querySelectorAll('.nav-link');
      navLinks.forEach(link => link.classList.remove('active'));
      
      // Show the selected view
      const targetHash = hash || '#home';
      const targetView = document.querySelector(targetHash);
      if (targetView) {
        targetView.classList.add('active');
        
        // Activate the corresponding nav link
        const activeLink = document.querySelector(`.nav-link[href="${targetHash}"]`);
        if (activeLink) {
          activeLink.classList.add('active');
        }
        
        // Initialize view-specific functionality
        initializeView(targetHash.substring(1)); // Remove # from the hash
      }
    }
    
    // Handle initial route and route changes
    navigateTo(window.location.hash);
    window.addEventListener('hashchange', () => {
      navigateTo(window.location.hash);
    });
  }
  
  function setupMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navMenu.classList.toggle('active');
    });
    
    // Close mobile menu when clicking a nav link
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
      });
    });
  }
  
  function setupEventListeners() {
    // Crop Scheduler
    const generateScheduleBtn = document.getElementById('generate-schedule');
    if (generateScheduleBtn) {
      generateScheduleBtn.addEventListener('click', generateSchedule);
    }
    
    // Weather-Aware Scheduler
    const generateWeatherScheduleBtn = document.getElementById('generate-weather-schedule');
    if (generateWeatherScheduleBtn) {
      generateWeatherScheduleBtn.addEventListener('click', generateWeatherAwareSchedule);
    }
    
    // Market Trends
    const regionSelector = document.getElementById('region-selector');
    if (regionSelector) {
      regionSelector.addEventListener('change', fetchMarketData);
    }
    
    // Disease Detector
    const uploadArea = document.getElementById('upload-area');
    const imageUpload = document.getElementById('image-upload');
    const browseButton = document.getElementById('browse-button');
    const analyzeButton = document.getElementById('analyze-image');
    const changeImageButton = document.getElementById('change-image');
    
    if (uploadArea && imageUpload) {
      uploadArea.addEventListener('click', () => imageUpload.click());
      imageUpload.addEventListener('change', handleImageSelect);
      
      if (browseButton) browseButton.addEventListener('click', (e) => {
        e.stopPropagation();
        imageUpload.click();
      });
      
      if (analyzeButton) analyzeButton.addEventListener('click', analyzeImage);
      if (changeImageButton) changeImageButton.addEventListener('click', resetImageUpload);
      
      // Drag and drop functionality
      uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('border-primary');
      });
      
      uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('border-primary');
      });
      
      uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('border-primary');
        if (e.dataTransfer.files.length) {
          imageUpload.files = e.dataTransfer.files;
          handleImageSelect();
        }
      });
    }
    
    // Mixed Cropping
    const checkCompatibilityBtn = document.getElementById('check-compatibility');
    if (checkCompatibilityBtn) {
      checkCompatibilityBtn.addEventListener('click', checkCropCompatibility);
    }
  }
  
  function initializeView(viewId) {
    switch (viewId) {
      case 'market-trends':
        fetchMarketData();
        break;
      case 'shop-locator':
        initMap();
        break;
    }
  }
  
  // =========================================
  // Crop Scheduler
  // =========================================
  function generateSchedule() {
    const seedingDateInput = document.getElementById('seeding-date');
    const scheduleTable = document.getElementById('schedule-table');
    const scheduleBody = document.getElementById('schedule-body');
    const scheduleEmpty = document.querySelector('#scheduler .schedule-empty');
    const scheduleTableContainer = document.querySelector('#scheduler .schedule-table-container');
    
    if (!seedingDateInput.value) {
      alert('Please select a seeding date');
      return;
    }
    
    const seedingDate = new Date(seedingDateInput.value);
    const schedule = createSchedule(seedingDate);
    
    // Clear existing table rows
    scheduleBody.innerHTML = '';
    
    // Add schedule rows to the table
    schedule.forEach(entry => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${formatDate(entry.date)}</td>
        <td>${entry.daysSinceSeeding}</td>
        <td>${entry.treatment}</td>
      `;
      scheduleBody.appendChild(row);
    });
    
    // Show the table and hide the empty state
    scheduleEmpty.style.display = 'none';
    scheduleTableContainer.style.display = 'block';
  }
  
  function createSchedule(seedingDate) {
    const schedule = [];
    const today = new Date();
    
    // Create entries for the next 180 days (approximately 6 months)
    for (let day = 0; day <= 180; day += 1) {
      const currentDate = new Date(seedingDate);
      currentDate.setDate(seedingDate.getDate() + day);
      
      // Skip dates in the past
      if (currentDate < today && day > 0) continue;
      
      // Add entry for seeding date
      if (day === 0) {
        schedule.push({
          date: new Date(currentDate),
          daysSinceSeeding: day,
          treatment: 'Seeding'
        });
        continue;
      }
      
      // Check for treatments
      let treatment = null;
      
      // Apply Fertilizer A every 14 days
      if (day % 14 === 0 && day > 0) {
        treatment = 'Fertilizer A';
      }
      
      // Apply Pesticide X every 30 days
      if (day % 30 === 0 && day > 0) {
        treatment = treatment ? `${treatment}, Pesticide X` : 'Pesticide X';
      }
      
      // Only add entries with treatments
      if (treatment) {
        schedule.push({
          date: new Date(currentDate),
          daysSinceSeeding: day,
          treatment: treatment
        });
      }
    }
    
    return schedule;
  }
  
  // =========================================
  // Weather-Aware Schedule
  // =========================================
  function generateWeatherAwareSchedule() {
    const seedingDateInput = document.getElementById('weather-seeding-date');
    const locationInput = document.getElementById('location');
    const scheduleTable = document.getElementById('weather-schedule-table');
    const scheduleBody = document.getElementById('weather-schedule-body');
    const scheduleEmpty = document.querySelector('#weather-scheduler .schedule-empty');
    const scheduleTableContainer = document.querySelector('#weather-scheduler .schedule-table-container');
    const weatherInfo = document.querySelector('#weather-scheduler .weather-info');
    
    if (!seedingDateInput.value) {
      alert('Please select a seeding date');
      return;
    }
    
    if (!locationInput.value) {
      alert('Please enter a location');
      return;
    }
    
    const seedingDate = new Date(seedingDateInput.value);
    const location = locationInput.value;
    
    // Show loading state
    scheduleEmpty.innerHTML = '<i class="fas fa-spinner fa-spin"></i><p>Generating weather-aware schedule...</p>';
    
    // Fetch weather forecast (for demonstration purposes, we'll use mock data)
    fetchWeatherForecast(location)
      .then(forecast => {
        // Generate the schedule with weather adjustments
        const schedule = createWeatherAwareSchedule(seedingDate, forecast);
        
        // Clear existing table rows
        scheduleBody.innerHTML = '';
        
        // Add schedule rows to the table
        schedule.forEach(entry => {
          const row = document.createElement('tr');
          
          // Determine if the date was adjusted
          const dateWasAdjusted = entry.originalDate && 
                                 entry.originalDate.getTime() !== entry.date.getTime();
          
          row.innerHTML = `
            <td>${dateWasAdjusted ? 
                  `<span class="strikethrough">${formatDate(entry.originalDate)}</span>` : 
                  formatDate(entry.date)}</td>
            <td>${formatDate(entry.date)}</td>
            <td>${entry.daysSinceSeeding}</td>
            <td>${entry.treatment}</td>
            <td>
              ${entry.weather ? 
                `<div class="weather-icon">
                  <i class="${getWeatherIcon(entry.weather.condition)}"></i>
                  <span>${entry.weather.temp}°C</span>
                </div>` : ''}
            </td>
          `;
          scheduleBody.appendChild(row);
        });
        
        // Show the table and hide the empty state
        scheduleEmpty.style.display = 'none';
        weatherInfo.style.display = 'block';
        scheduleTableContainer.style.display = 'block';
      })
      .catch(error => {
        console.error('Error fetching weather data:', error);
        scheduleEmpty.innerHTML = `
          <i class="fas fa-exclamation-triangle"></i>
          <p>Error fetching weather data. Please try again.</p>
        `;
      });
  }
  
  function fetchWeatherForecast(location) {
    // NOTE: Replace this with actual API call to OpenWeatherMap
    // OpenWeatherMap API endpoint: https://api.openweathermap.org/data/2.5/forecast
    // API Key should be stored in a constant at the top of this file:
    // const OPENWEATHER_API_KEY = 'YOUR_API_KEY_HERE';
    
    // For demonstration, return mock forecast data
    return new Promise((resolve) => {
      setTimeout(() => {
        const forecast = generateMockWeatherForecast();
        resolve(forecast);
      }, 1000); // Simulate API delay
    });
  }
  
  function generateMockWeatherForecast() {
    // Generate 14 days of mock weather data
    const forecast = [];
    const today = new Date();
    
    for (let i = 0; i < 14; i++) {
      const forecastDate = new Date(today);
      forecastDate.setDate(today.getDate() + i);
      
      // Random temperature between 15 and 35
      const temp = Math.floor(Math.random() * 20) + 15;
      
      // Random humidity between 40 and 90
      const humidity = Math.floor(Math.random() * 50) + 40;
      
      // Random condition
      const conditions = ['clear', 'clouds', 'rain', 'thunderstorm'];
      const condition = conditions[Math.floor(Math.random() * conditions.length)];
      
      forecast.push({
        date: forecastDate,
        temp: temp,
        humidity: humidity,
        condition: condition
      });
    }
    
    return forecast;
  }
  
  function createWeatherAwareSchedule(seedingDate, forecast) {
    // First, create a regular schedule
    const regularSchedule = createSchedule(seedingDate);
    
    // Then adjust based on weather constraints
    const weatherAwareSchedule = regularSchedule.map(entry => {
      // If this is the seeding entry, no adjustments needed
      if (entry.daysSinceSeeding === 0) {
        return entry;
      }
      
      // Check if the entry date is within the forecast period
      const entryDate = new Date(entry.date);
      const today = new Date();
      const forecastEndDate = new Date(today);
      forecastEndDate.setDate(today.getDate() + 13); // 14-day forecast
      
      if (entryDate > forecastEndDate) {
        // Beyond forecast period, no weather data to adjust with
        return entry;
      }
      
      // Check weather conditions for pesticide application
      if (entry.treatment.includes('Pesticide')) {
        // Find the forecast for the entry date
        const forecastDay = forecast.find(day => 
          day.date.getDate() === entryDate.getDate() && 
          day.date.getMonth() === entryDate.getMonth());
        
        if (forecastDay) {
          // Weather constraints for pesticide application
          const isSuitable = forecastDay.temp >= 25 && forecastDay.humidity <= 70;
          
          if (!isSuitable) {
            // Weather is not suitable, find the nearest suitable day
            const newDate = findSuitableDate(entryDate, forecast);
            if (newDate) {
              // Calculate new days since seeding
              const daysDiff = Math.round((newDate - seedingDate) / (1000 * 60 * 60 * 24));
              
              // Find the weather for the new date
              const newForecastDay = forecast.find(day => 
                day.date.getDate() === newDate.getDate() && 
                day.date.getMonth() === newDate.getMonth());
                
              return {
                originalDate: entry.date,
                date: newDate,
                daysSinceSeeding: daysDiff,
                treatment: entry.treatment,
                weather: newForecastDay
              };
            }
          }
          
          // Weather is suitable or no better date found
          return {
            date: entry.date,
            daysSinceSeeding: entry.daysSinceSeeding,
            treatment: entry.treatment,
            weather: forecastDay
          };
        }
      }
      
      // No adjustments needed or not a pesticide treatment
      return entry;
    });
    
    return weatherAwareSchedule;
  }
  
  function findSuitableDate(originalDate, forecast) {
    // Check both before and after the original date
    const suitableDays = forecast.filter(day => 
      day.temp >= 25 && day.humidity <= 70
    );
    
    if (suitableDays.length === 0) return null;
    
    // Find the closest suitable day
    let closestDay = null;
    let minDiff = Number.MAX_SAFE_INTEGER;
    
    suitableDays.forEach(day => {
      const diff = Math.abs(day.date - originalDate);
      if (diff < minDiff) {
        minDiff = diff;
        closestDay = day;
      }
    });
    
    return closestDay ? new Date(closestDay.date) : null;
  }
  
  function getWeatherIcon(condition) {
    switch (condition) {
      case 'clear':
        return 'fas fa-sun';
      case 'clouds':
        return 'fas fa-cloud';
      case 'rain':
        return 'fas fa-cloud-rain';
      case 'thunderstorm':
        return 'fas fa-bolt';
      default:
        return 'fas fa-cloud';
    }
  }
  
  // =========================================
  // Market Trends
  // =========================================
  function fetchMarketData() {
    const region = document.getElementById('region-selector').value;
    
    // NOTE: Replace with actual API call
    // const MARKET_API_ENDPOINT = 'https://api.example.com/market-data';
    // fetch(`${MARKET_API_ENDPOINT}?region=${region}`)
    
    // For demonstration, use mock data
    setTimeout(() => {
      const marketData = generateMockMarketData(region);
      renderMarketChart(marketData);
      renderTopCrops(marketData);
    }, 500);
  }
  
  function generateMockMarketData(region) {
    // Mock crop price data for the last 30 days
    const crops = ['Rice', 'Wheat', 'Maize', 'Barley', 'Soybeans', 'Potatoes', 'Tomatoes'];
    const today = new Date();
    const data = { dates: [], crops: {} };
    
    // Initialize crop data
    crops.forEach(crop => {
      data.crops[crop] = {
        prices: [],
        trend: Math.random() > 0.5 ? 'up' : 'down',
        change: (Math.random() * 10).toFixed(1)
      };
    });
    
    // Generate data for the last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      data.dates.push(formatDate(date));
      
      crops.forEach(crop => {
        // Base price varies by region and crop
        let basePrice = 0;
        switch (region) {
          case 'north':
            basePrice = 50 + (crops.indexOf(crop) * 10);
            break;
          case 'south':
            basePrice = 45 + (crops.indexOf(crop) * 12);
            break;
          case 'east':
            basePrice = 55 + (crops.indexOf(crop) * 8);
            break;
          case 'west':
            basePrice = 60 + (crops.indexOf(crop) * 7);
            break;
          default: // central
            basePrice = 52 + (crops.indexOf(crop) * 9);
        }
        
        // Add randomness and trend
        const trendFactor = data.crops[crop].trend === 'up' ? 1 : -1;
        const dailyChange = (Math.random() * 2 - 0.5) + (i * 0.1 * trendFactor);
        const price = basePrice + dailyChange;
        data.crops[crop].prices.push(price.toFixed(2));
      });
    }
    
    return data;
  }
  
  function renderMarketChart(data) {
    const ctx = document.getElementById('price-chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.priceChart) {
      window.priceChart.destroy();
    }
    
    // Create datasets for each crop
    const datasets = [];
    const colors = [
      'rgba(75, 192, 192, 1)',
      'rgba(255, 99, 132, 1)',
      'rgba(54, 162, 235, 1)',
      'rgba(255, 206, 86, 1)',
      'rgba(153, 102, 255, 1)',
      'rgba(255, 159, 64, 1)',
      'rgba(199, 199, 199, 1)'
    ];
    
    let colorIndex = 0;
    for (const crop in data.crops) {
      datasets.push({
        label: crop,
        data: data.crops[crop].prices,
        borderColor: colors[colorIndex % colors.length],
        backgroundColor: colors[colorIndex % colors.length].replace('1)', '0.1)'),
        tension: 0.3
      });
      colorIndex++;
    }
    
    // Create the chart
    window.priceChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.dates,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Crop Price Trends (Last 30 Days)',
            font: {
              size: 16
            }
          },
          legend: {
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: 'Price (USD/kg)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Date'
            }
          }
        }
      }
    });
  }
  
  function renderTopCrops(data) {
    const topCropsList = document.getElementById('top-crops-list');
    topCropsList.innerHTML = '';
    
    // Calculate average price for the last 7 days for each crop
    const cropAverages = [];
    for (const crop in data.crops) {
      const recentPrices = data.crops[crop].prices.slice(-7).map(price => parseFloat(price));
      const avgPrice = recentPrices.reduce((sum, price) => sum + price, 0) / recentPrices.length;
      cropAverages.push({
        name: crop,
        avgPrice: avgPrice,
        trend: data.crops[crop].trend,
        change: data.crops[crop].change
      });
    }
    
    // Sort by highest average price
    cropAverages.sort((a, b) => b.avgPrice - a.avgPrice);
    
    // Display the top 3
    const topCrops = cropAverages.slice(0, 3);
    topCrops.forEach(crop => {
      const cropItem = document.createElement('div');
      cropItem.className = 'crop-item';
      cropItem.innerHTML = `
        <div class="crop-info">
          <div class="crop-name">${crop.name}</div>
          <div class="crop-trend ${crop.trend === 'up' ? 'trend-up' : 'trend-down'}">
            <i class="fas fa-arrow-${crop.trend}"></i> ${crop.change}%
          </div>
        </div>
        <div class="crop-price">$${crop.avgPrice.toFixed(2)}</div>
      `;
      topCropsList.appendChild(cropItem);
    });
  }
  
  // =========================================
  // Shop Locator
  // =========================================
  let map, userLocation;
  
  function initMap() {
    // Check if map already initialized
    if (map) return;
    
    // Get the map container
    const mapContainer = document.getElementById('map');
    
    // Initialize the map with default location (will be updated with user's location)
    map = L.map('map').setView([40.7128, -74.0060], 13);
    
    // Add the tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Try to get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          // Update map view
          map.setView([userLocation.lat, userLocation.lng], 13);
          
          // Add user marker
          const userIcon = L.divIcon({
            html: '<i class="fas fa-user-circle" style="color: #4d7c0f; font-size: 24px;"></i>',
            className: 'user-marker',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });
          
          L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
            .addTo(map)
            .bindPopup('Your Location')
            .openPopup();
          
          // Load nearby shops
          loadShops(userLocation);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Use default location and load shops
          userLocation = { lat: 40.7128, lng: -74.0060 }; // New York City
          loadShops(userLocation);
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
      // Use default location and load shops
      userLocation = { lat: 40.7128, lng: -74.0060 }; // New York City
      loadShops(userLocation);
    }
  }
  
  function loadShops(location) {
    // NOTE: Replace with actual API call to get shops
    // const SHOPS_API_ENDPOINT = 'https://api.example.com/shops';
    // fetch(`${SHOPS_API_ENDPOINT}?lat=${location.lat}&lng=${location.lng}`)
    
    // For demonstration, use mock shop data
    const shops = generateMockShops(location);
    
    // Add shop markers to the map
    shops.forEach(shop => {
      const shopIcon = L.divIcon({
        html: '<i class="fas fa-store" style="color: #f59e0b; font-size: 20px;"></i>',
        className: 'shop-marker',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
      
      const marker = L.marker([shop.lat, shop.lng], { icon: shopIcon })
        .addTo(map)
        .bindPopup(`
          <div class="map-popup">
            <h3>${shop.name}</h3>
            <p>${shop.address}</p>
            <p><strong>Phone:</strong> ${shop.phone}</p>
            <a href="#" class="popup-link">Visit Website</a>
          </div>
        `);
      
      shop.marker = marker;
    });
    
    // Render the shops list
    renderShopsList(shops);
  }
  
  function generateMockShops(center) {
    // Generate 8 random shops near the user's location
    const shops = [];
    const shopNames = [
      'FarmSupply Plus', 
      'AgriMart', 
      'Green Acres Supply', 
      'Harvest Helper', 
      'CropCare Center',
      'Rural King',
      'Farm & Fleet',
      'Agway'
    ];
    
    for (let i = 0; i < shopNames.length; i++) {
      // Generate random offset from center (within ~5km)
      const latOffset = (Math.random() - 0.5) * 0.09;
      const lngOffset = (Math.random() - 0.5) * 0.09;
      
      // Calculate distance in km using Haversine formula
      const lat1 = center.lat;
      const lon1 = center.lng;
      const lat2 = center.lat + latOffset;
      const lon2 = center.lng + lngOffset;
      
      const R = 6371; // Radius of the earth in km
      const dLat = deg2rad(lat2 - lat1);
      const dLon = deg2rad(lon2 - lon1);
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2); 
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      const distance = R * c; // Distance in km
      
      shops.push({
        id: i + 1,
        name: shopNames[i],
        address: `${Math.floor(Math.random() * 1000) + 100} Main St`,
        lat: center.lat + latOffset,
        lng: center.lng + lngOffset,
        distance: distance.toFixed(1),
        phone: `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`
      });
    }
    
    // Sort by distance
    shops.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    
    return shops;
  }
  
  function deg2rad(deg) {
    return deg * (Math.PI/180);
  }
  
  function renderShopsList(shops) {
    const shopsListContainer = document.getElementById('shops-list-container');
    shopsListContainer.innerHTML = '';
    
    shops.forEach(shop => {
      const shopCard = document.createElement('div');
      shopCard.className = 'shop-card';
      shopCard.innerHTML = `
        <div class="shop-name">${shop.name}</div>
        <div class="shop-distance"><i class="fas fa-map-marker-alt"></i> ${shop.distance} km away</div>
        <div class="shop-contact"><i class="fas fa-phone"></i> ${shop.phone}</div>
        <div class="shop-actions">
          <button class="btn btn-primary btn-sm show-on-map" data-shop-id="${shop.id}">Show on Map</button>
          <button class="btn btn-outlined btn-sm">Buy Online</button>
        </div>
      `;
      shopsListContainer.appendChild(shopCard);
      
      // Add click handler for "Show on Map" button
      const showOnMapBtn = shopCard.querySelector('.show-on-map');
      showOnMapBtn.addEventListener('click', () => {
        const shopObj = shops.find(s => s.id === parseInt(showOnMapBtn.dataset.shopId));
        if (shopObj && shopObj.marker) {
          map.setView([shopObj.lat, shopObj.lng], 15);
          shopObj.marker.openPopup();
        }
      });
    });
  }
  
  // =========================================
  // Disease Detector
  // =========================================
  function handleImageSelect() {
    const imageUpload = document.getElementById('image-upload');
    const imagePreview = document.getElementById('leaf-image-preview');
    const uploadArea = document.getElementById('upload-area');
    const imagePreviewContainer = document.querySelector('.image-preview-container');
    const diseaseResult = document.getElementById('disease-result');
    
    if (imageUpload.files && imageUpload.files[0]) {
      const reader = new FileReader();
      
      reader.onload = function(e) {
        imagePreview.src = e.target.result;
        uploadArea.style.display = 'none';
        imagePreviewContainer.style.display = 'block';
        diseaseResult.style.display = 'none';
      };
      
      reader.readAsDataURL(imageUpload.files[0]);
    }
  }
  
  function resetImageUpload() {
    const imageUpload = document.getElementById('image-upload');
    const uploadArea = document.getElementById('upload-area');
    const imagePreviewContainer = document.querySelector('.image-preview-container');
    const diseaseResult = document.getElementById('disease-result');
    
    imageUpload.value = '';
    uploadArea.style.display = 'flex';
    imagePreviewContainer.style.display = 'none';
    diseaseResult.style.display = 'none';
  }
  
  function analyzeImage() {
    const imageUpload = document.getElementById('image-upload');
    const diseaseResult = document.getElementById('disease-result');
    
    if (imageUpload.files && imageUpload.files[0]) {
      // Show loading state
      diseaseResult.innerHTML = `
        <div class="alert alert-info">
          <i class="fas fa-spinner fa-spin"></i>
          <span>Analyzing image...</span>
        </div>
      `;
      diseaseResult.style.display = 'block';
      
      // Simulate API call delay
      setTimeout(() => {
        const result = detectDisease(imageUpload.files[0]);
        renderDiseaseResult(result);
      }, 1500);
    }
  }
  
  function detectDisease(file) {
    // NOTE: Replace with actual AI model API call
    // const DISEASE_DETECTION_API = 'https://api.example.com/detect-disease';
    // const formData = new FormData();
    // formData.append('image', file);
    // return fetch(DISEASE_DETECTION_API, { method: 'POST', body: formData })
    
    // For demonstration, return a random result
    const diseases = ['healthy', 'blight', 'rust', 'mildew'];
    const result = diseases[Math.floor(Math.random() * diseases.length)];
    return result;
  }
  
  function renderDiseaseResult(disease) {
    const diseaseResult = document.getElementById('disease-result');
    
    let resultHTML = '';
    
    switch (disease) {
      case 'healthy':
        resultHTML = `
          <div class="disease-result-card healthy">
            <div class="disease-header">
              <i class="fas fa-check-circle"></i>
              <h3>Healthy Plant Detected</h3>
            </div>
            <p>Your plant appears to be healthy! No signs of disease were detected in the uploaded image.</p>
            <p>Continue your current care practices as they're working well.</p>
            <div class="disease-actions">
              <button class="btn btn-primary" onclick="resetImageUpload()">Analyze Another Image</button>
            </div>
          </div>
        `;
        break;
      case 'blight':
        resultHTML = `
          <div class="disease-result-card blight">
            <div class="disease-header">
              <i class="fas fa-exclamation-triangle"></i>
              <h3>Early Blight Detected</h3>
            </div>
            <p>We've detected signs of early blight on your plant. This fungal disease typically appears as dark spots with concentric rings, often on lower and older leaves first.</p>
            <p>Recommended actions:</p>
            <ul>
              <li>Remove and destroy affected leaves</li>
              <li>Ensure good air circulation around plants</li>
              <li>Apply recommended fungicide following the product instructions</li>
            </ul>
            <div class="disease-actions">
              <a href="#" class="btn btn-secondary">Learn More</a>
              <button class="btn btn-primary" onclick="resetImageUpload()">Analyze Another Image</button>
            </div>
          </div>
        `;
        break;
      case 'rust':
        resultHTML = `
          <div class="disease-result-card rust">
            <div class="disease-header">
              <i class="fas fa-exclamation-triangle"></i>
              <h3>Rust Disease Detected</h3>
            </div>
            <p>We've detected signs of rust disease on your plant. This fungal infection appears as orange, yellow, or reddish-brown pustules on the underside of leaves.</p>
            <p>Recommended actions:</p>
            <ul>
              <li>Remove and destroy affected plant parts</li>
              <li>Avoid overhead watering to keep foliage dry</li>
              <li>Apply appropriate fungicides early in the disease cycle</li>
            </ul>
            <div class="disease-actions">
              <a href="#" class="btn btn-secondary">Learn More</a>
              <button class="btn btn-primary" onclick="resetImageUpload()">Analyze Another Image</button>
            </div>
          </div>
        `;
        break;
      case 'mildew':
        resultHTML = `
          <div class="disease-result-card mildew">
            <div class="disease-header">
              <i class="fas fa-exclamation-triangle"></i>
              <h3>Powdery Mildew Detected</h3>
            </div>
            <p>We've detected signs of powdery mildew on your plant. This fungal disease appears as white powdery spots on leaves and stems.</p>
            <p>Recommended actions:</p>
            <ul>
              <li>Improve air circulation around plants</li>
              <li>Remove and destroy severely infected plant parts</li>
              <li>Apply fungicide specifically labeled for powdery mildew</li>
              <li>Water at the base of plants, not on foliage</li>
            </ul>
            <div class="disease-actions">
              <a href="#" class="btn btn-secondary">Learn More</a>
              <button class="btn btn-primary" onclick="resetImageUpload()">Analyze Another Image</button>
            </div>
          </div>
        `;
        break;
    }
    
    diseaseResult.innerHTML = resultHTML;
    diseaseResult.style.display = 'block';
  }
  
  // =========================================
  // Mixed Cropping
  // =========================================
  function checkCropCompatibility() {
    const cropsSelector = document.getElementById('crops-selector');
    const compatibilityResult = document.getElementById('compatibility-result');
    
    // Get selected crops
    const selectedCrops = Array.from(cropsSelector.selectedOptions).map(option => option.value);
    
    if (selectedCrops.length < 2) {
      alert('Please select at least two crops to check compatibility');
      return;
    }
    
    const compatibilityInfo = getCompatibility(selectedCrops);
    
    // Render the result
    let resultHTML = '';
    
    const iconMap = {
      good: 'check-circle',
      moderate: 'exclamation-circle',
      poor: 'times-circle'
    };
    
    resultHTML = `
      <div class="compatibility-card ${compatibilityInfo.rating}">
        <div class="compatibility-header">
          <i class="fas fa-${iconMap[compatibilityInfo.rating]}"></i>
          <h3>${compatibilityInfo.title}</h3>
        </div>
        <div class="crop-combination">
          ${selectedCrops.map(crop => crop.charAt(0).toUpperCase() + crop.slice(1)).join(' + ')}
        </div>
        <div class="compatibility-rating ${compatibilityInfo.rating}">${compatibilityInfo.rating.toUpperCase()}</div>
        <p>${compatibilityInfo.description}</p>
        ${compatibilityInfo.tips ? `
          <div class="compatibility-tips">
            <h4>Planting tips:</h4>
            <ul>
              ${compatibilityInfo.tips.map(tip => `<li>${tip}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `;
    
    compatibilityResult.innerHTML = resultHTML;
    compatibilityResult.style.display = 'block';
  }
  
  function getCompatibility(crops) {
    // Define compatibility matrix
    // This is a simple implementation; in a real app, this could be:
    // 1. A more complex matrix considering all combinations
    // 2. An API call to get scientific compatibility data
    // 3. A database lookup of well-known companion planting pairs
    
    const compatibilityMatrix = {
      // Good combinations
      'maize_beans': {
        rating: 'good',
        title: 'Good Companion Planting',
        description: 'Maize and beans are classic companion plants in the "Three Sisters" method. Beans fix nitrogen in the soil which benefits maize, while maize provides a natural trellis for beans to climb.',
        tips: [
          'Plant maize first and let it grow to about 6 inches',
          'Then plant beans around the maize stalks',
          'Space maize plants about 12 inches apart'
        ]
      },
      'tomato_onion': {
        rating: 'good',
        title: 'Good Companion Planting',
        description: 'Onions help repel pests that commonly attack tomatoes, while tomatoes provide partial shade for onions. This pairing helps optimize garden space and reduce pest problems.',
        tips: [
          'Plant onions around the perimeter of tomato plants',
          'Allow 18-24 inches between tomato plants',
          'Onions can be planted 4-5 inches apart'
        ]
      },
      'carrot_onion': {
        rating: 'good',
        title: 'Good Companion Planting',
        description: 'Onions help deter carrot flies with their strong scent, while carrots help loosen the soil for onions. This combination efficiently uses garden space and provides mutual pest protection.',
        tips: [
          'Alternate rows of carrots and onions',
          'Plant carrots 2-3 inches apart',
          'Plant onions 4-5 inches apart'
        ]
      },
      'lettuce_cucumber': {
        rating: 'good',
        title: 'Good Companion Planting',
        description: 'Lettuce and cucumbers work well together because lettuce acts as a living mulch, helping to keep the soil cool and moist for cucumbers, while cucumbers provide partial shade for lettuce in hot weather.',
        tips: [
          'Plant lettuce between cucumber plants',
          'Space cucumber plants 36-60 inches apart',
          'Harvest lettuce before cucumbers fully mature and take over'
        ]
      },
      
      // Moderate combinations
      'maize_tomato': {
        rating: 'moderate',
        title: 'Moderate Compatibility',
        description: 'Maize and tomatoes can be grown together, but they compete for similar nutrients. Both are heavy feeders, so additional fertilizer may be required for optimal growth of both crops.',
        tips: [
          'Provide extra fertilizer, especially nitrogen',
          'Ensure adequate spacing (at least 24 inches)',
          'Plant in alternating rows rather than mixed together'
        ]
      },
      'beans_onion': {
        rating: 'moderate',
        title: 'Moderate Compatibility',
        description: 'Beans and onions can grow together, but onions may inhibit the growth of beans. However, they can still be planted in the same garden with proper spacing and management.',
        tips: [
          'Keep at least 12-18 inches between bean and onion plants',
          'Plant them in separate rows rather than intermixing',
          'Use bush beans rather than pole beans if possible'
        ]
      },
      
      // Poor combinations
      'tomato_potato': {
        rating: 'poor',
        title: 'Avoid Planting Together',
        description: 'Tomatoes and potatoes are both in the nightshade family and share similar diseases and pests. Growing them together increases the risk of disease spread and can significantly reduce yields of both crops.'
      },
      'beans_garlic': {
        rating: 'poor',
        title: 'Avoid Planting Together',
        description: 'Garlic releases compounds that can inhibit the growth of beans. Beans may grow poorly or fail to produce well when planted near garlic or other alliums.'
      },
      'cucumber_potato': {
        rating: 'poor',
        title: 'Avoid Planting Together',
        description: 'Cucumbers and potatoes are not compatible companions. Potatoes can increase the risk of blight which may affect cucumber growth and production.'
      }
    };
    
    // Sort crops alphabetically to ensure consistent key generation
    const sortedCrops = [...crops].sort();
    
    // Check all combinations of crops
    let worstRating = 'good';
    let compatibilityInfo = null;
    
    for (let i = 0; i < sortedCrops.length - 1; i++) {
      for (let j = i + 1; j < sortedCrops.length; j++) {
        const crop1 = sortedCrops[i];
        const crop2 = sortedCrops[j];
        const key = `${crop1}_${crop2}`;
        
        // Check if this combination is in our matrix
        if (compatibilityMatrix[key]) {
          const rating = compatibilityMatrix[key].rating;
          
          // Update worst rating
          if (rating === 'poor' || (rating === 'moderate' && worstRating === 'good')) {
            worstRating = rating;
            compatibilityInfo = compatibilityMatrix[key];
          }
        }
      }
    }
    
    // If we didn't find any specific combinations, provide a default response
    if (!compatibilityInfo) {
      return {
        rating: 'moderate',
        title: 'Limited Compatibility Data',
        description: 'We don\'t have specific information about this combination of crops. Consider researching each pair individually or consulting with a local agricultural extension office for more targeted advice.',
        tips: [
          'Space plants adequately to reduce competition',
          'Monitor closely for any signs of interference',
          'Consider a test plot before large-scale planting'
        ]
      };
    }
    
    return compatibilityInfo;
  }
  
  // =========================================
  // Utility Functions
  // =========================================
  function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  