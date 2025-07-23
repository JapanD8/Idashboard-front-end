// document.addEventListener('DOMContentLoaded', function() {
//     const chatMessages = document.getElementById('chat-messages');
//     const chatInput = document.getElementById('chat-input');

//     function scrollToBottom() {
//         chatMessages.scrollTop = chatMessages.scrollHeight;
//       }

//     // Initial message from AI
//     const aiInitialMessage = document.createElement('div');
//     aiInitialMessage.classList.add('message', 'ai-message');
//     aiInitialMessage.innerHTML = `
//     <span class="ai-icon">AI</span>
//     <span class="message-text">Hi! How can I assist you today?</span>
//     `;
//     chatMessages.appendChild(aiInitialMessage);
//     scrollToBottom();

//     // Function to send the message to the endpoint
//     function sendMessage() {
//     const message = chatInput.value.trim();
//     chatInput.value = '';

//     // Create a new message element for the user's message
//     const userMessage = document.createElement('div');
//     userMessage.classList.add('message', 'user-message');
//     userMessage.innerHTML = `
//         <span class="message-text">${message}</span>
//         <span class="user-icon">U</span>
//     `;
//     chatMessages.appendChild(userMessage);
//     scrollToBottom();

//     // Send the message to the endpoint
//     fetch('/chat_ai', {
//         method: 'GET',
//         headers: {
//         'Content-Type': 'application/json'
//         }
//     })
//     .then(response => response.json())
//     .then(data => {
//         if (data.success) {
//         const responseData = data.data;
//         // Create a new message element for the response
//         const aiMessage = document.createElement('div');
//         aiMessage.classList.add('message', 'ai-message');
//         aiMessage.innerHTML = `
//             <span class="ai-icon">AI</span>
//             <span class="message-text">${responseData.message}</span>
//         `;
//         chatMessages.appendChild(aiMessage);
//         scrollToBottom();

//         // Display the chart
//         displayChart(responseData.chart_type, responseData.chart_data);
//         } else {
//         console.error('Error fetching data');
//         }
//     })
//     .catch(error => console.error(error));
//     }

//     // Function to display the chart
//     function displayChart(chartType, chartData) {
//     const chartContainer = document.createElement('div');
//     chartContainer.classList.add('chart-container');
//     chatMessages.appendChild(chartContainer);
//     scrollToBottom();

//     const ctx = document.createElement('canvas').getContext('2d');
//     chartContainer.appendChild(ctx.canvas);
//     ctx.canvas.width = 280;
//     ctx.canvas.height = 180;

//     // Generate random colors for the chart
//     const backgroundColors = chartData.data.map(() => {
//         const r = Math.floor(Math.random() * 256);
//         const g = Math.floor(Math.random() * 256);
//         const b = Math.floor(Math.random() * 256);
//         return `rgba(${r}, ${g}, ${b}, 0.2)`;
//     });

//     const borderColors = backgroundColors.map(color => color.replace('0.2', '1'));

//     if (chartType === 'bar') {
//         new Chart(ctx, {
//         type: 'bar',
//         data: {
//             labels: chartData.labels,
//             datasets: [{
//             label: chartData.label,
//             data: chartData.data,
//             backgroundColor: backgroundColors,
//             borderColor: borderColors,
//             borderWidth: 1
//             }]
//         },
//         options: {
//             scales: {
//             y: {
//                 beginAtZero: true
//             }
//             }
//         }
//         });
//     }
//     }

//     chatInput.addEventListener('keypress', (e) => {
//     if (e.key === 'Enter') {
//         sendMessage();
//     }
// });
// });


// Trigger loadHistory on page load


document.addEventListener('DOMContentLoaded', function() {


    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const userId = localStorage.getItem('user_id');; // Replace with actual user ID
    const dbId = localStorage.getItem('chatId'); // Replace with actual DB ID
    let sessionId = localStorage.getItem('session_id');
    const typingIndicator = document.getElementById('typing-indicator');
    
    const initial_message = true;
    let user_messageicon = "U"
    const sesionemail = localStorage.getItem('email');
    console.log("sesionemail",sesionemail)
    const msgBody = document.getElementById('chat-messages');
    msgBody.innerHTML = '';
    let messagesLoaded = false;
    const scrollContainer = document.getElementById("scroll-container");


    function loadHistory() {
        const params = new URLSearchParams({ session_id: sessionId, db_id: dbId });
        fetch(`/get_messages?${params}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        })
        .then(response => response.json())
        .then(data => {
             // Clear existing messages
            msgBody.innerHTML = "";
            console.log("data2",data)
            data.forEach(message => {
                messagesLoaded = true;
                if (message.sender === 'user') {
                    const listItem = document.createElement('li');
                    listItem.classList.add('repaly'); // Assuming user is the one replying
                    //<span class="time">${formatTime(message.timestamp)}</span>
                    listItem.innerHTML = `
                        <p>${message.message}</p>
                    `;
                    msgBody.appendChild(listItem);
                    scrollToBottom();
                   
                } else if (message.sender === 'Ai') {
                    const listItem = document.createElement('li');
                    listItem.classList.add('sender');
                    listItem.innerHTML = `
                        <p>${message.message}</p>
                    `;
                    msgBody.appendChild(listItem);
                    scrollToBottom();
                } else {
                    // Handle other types of messages (e.g., charts)
                    if (message.message && Object.keys(message.message).length > 0) {
                        let chart_type = message.message.chart_type;
                        if (chart_type !== undefined && chart_type !== null) {
                            displayChart(chart_type, message.message.chart_data, message.embed_id);
                        }
                    }
                }
                
            
            });
    
            // // Add a divider for today's messages if needed
            // const todayDivider = document.createElement('li');
            // todayDivider.innerHTML = `
            //     <div class="divider">
            //         <h6>Today</h6>
            //     </div>
            // `;
            // msgBody.appendChild(todayDivider); // Uncomment if needed
    
            //scrollToBottom(); // Assuming this function scrolls the chat to the bottom
            setTimeout(() => {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
                console.log("Scrolled to:", scrollContainer.scrollTop, "/", scrollContainer.scrollHeight);
              }, 100);
            
        });
    }
    loadHistory();
    console.log("Scroll Height:", msgBody.scrollHeight);
    console.log("Client Height:", msgBody.clientHeight);
    console.log("Before Scroll:", msgBody.scrollTop);
    
    if (!sessionId) {
        // Create a new session ID if it doesn't exist
        fetch('/create_chat_session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, db_id: dbId })
        })
        .then(response => response.json())
        .then(data => {
            sessionId = data.session_id;
            localStorage.setItem('sessionId', sessionId);
        });
    }

    // function scrollToBottom() {
    //     const msgBodyContainer = document.querySelector('.msg-body li');
    //     msgBodyContainer.scrollTo({
    //         top: msgBodyContainer.scrollHeight,
    //         behavior: 'smooth'
    //     });
    // }
    function scrollToBottom() {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
        // // const chatContainer = document.getElementById("chat-messages");
        // // console.log("-scroll",msgBody)
        // // if (msgBody) {
        // //     msgBody.scrollTop = msgBody.scrollHeight;
        // // }
        // const container = document.getElementById('scroll-container');
        // if (container) {
        //     container.scrollTop = container.scrollHeight;
        //     console.log("Scrolled to:", container.scrollTop, "/", container.scrollHeight);
        // }
    }


    // Initial message from AI
    // if (!chatMessages.hasChildNodes()) {
    //     const aiInitialMessage = document.createElement('div');
    //     aiInitialMessage.classList.add('message', 'ai-message');
    //     aiInitialMessage.innerHTML = `
    //         <span class="ai-icon">AI</span>
    //         <span class="message-text">Hi! How can I assist you today?</span>
    //     `;
    //     chatMessages.appendChild(aiInitialMessage);
    //     scrollToBottom();
    // }
    const senders = msgBody.querySelectorAll('.sender');
    const replies = msgBody.querySelectorAll('.repaly')
    console.log("Number of senders:", senders.length);
    console.log("Number of replies:", replies.length);
    console.log("msgBody",msgBody); // Log the msgBody element itself
    console.log("msgBody.innerHTML",msgBody.innerHTML); // Log the innerHTML of msgBody
    console.log("msgBody.children",msgBody.childNodes);
    console.log("msgBody.children.length",chatMessages.childNodes)
    console.log("messagesLoaded",messagesLoaded)
    if (msgBody.children.length === 0) {
        const aiInitialMessage = document.createElement('li');
        aiInitialMessage.classList.add('sender');//<span class="time">${formatTime(new Date().getTime())}</span>
        aiInitialMessage.innerHTML = `
            <p>Hi! How can I assist you today?</p>
        `;
        msgBody.appendChild(aiInitialMessage);
        scrollToBottom();
    }



    // Function to send the message to the endpoint
    function sendMessage() {
        const message = chatInput.value.trim();
        console.log("chatInput-message",message)
        chatInput.value = '';
        const storedData = sessionStorage.getItem('mockdata-'+dbId);
        const schemadata = JSON.parse(storedData);
        

        // Create a new message element for the user's message
        // const userMessage = document.createElement('div');
        // userMessage.classList.add('message', 'user-message');
        // userMessage.innerHTML = `
        //     <span class="message-text">${message}</span>
        //     <span class="user-icon">${user_messageicon}</span>
        // `;
        // chatMessages.appendChild(userMessage);

        const listItem = document.createElement('li');
        listItem.classList.add('repaly'); // Assuming user is the one replying
        //<span class="time">${formatTime(message.timestamp)}</span>
        listItem.innerHTML = `
            <p>${message}</p>
        `;
        msgBody.appendChild(listItem);
        scrollToBottom();
        // Send the message to the endpoint
       
        fetch('/chat_ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId, message: message, schema_data: schemadata , dbId:dbId})
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const responseData = data.data;
                console.log( data.data, data.data)
                // Create a new message element for the response
                const listItem = document.createElement('li');
                listItem.classList.add('sender');
                listItem.innerHTML = `
                    <p>${data.data.message}</p>
                `;
                msgBody.appendChild(listItem);
                scrollToBottom();
                // Display the chart
                if (responseData.chart_type !== undefined && responseData.chart_type !== null){
                displayChart(responseData.chart_type, responseData.chart_data,  responseData.embed_id);
                }
            } else {
                console.error('Error fetching data');
            }
        })
        .catch(error => console.error(error));
    }

    document.getElementById('model-select').addEventListener('change', function() {
        var selectedOption = this.options[this.selectedIndex];
        if (selectedOption.getAttribute('data-popup') === 'true') {
          alert('You selected ' + selectedOption.text + " will work in future versions");
          // You can replace the alert with your own popup logic
          this.selectedIndex = 0; // Reset the selection to the first option
        }
      });

      async function createEmbeddableIframe(chartId) {
        try {
            
            // Create iframe URL
            const embedUrl = `/embed/${chartId}`;
            
            // Return iframe HTML
            return {
                iframe: `<iframe src="${embedUrl}" width="600" height="400" frameborder="0"></iframe>`,
                embedCode: `<iframe src="${window.location.origin}${embedUrl}" width="600" height="400" frameborder="0"></iframe>`,
                directLink: `${window.location.origin}${embedUrl}`
            };
        } catch (error) {
            console.error('Error creating embed:', error);
            return {
                error: 'Failed to create embeddable chart'
            };
        }
    }

    // Function to display the chart
    function displayChart(chartType, chartData, embed_id) {
        const chartWrapper = document.createElement('div');
        chartWrapper.classList.add('chart-wrapper');

        if (chartType === 'table') {
            const table = document.createElement('div');
            table.classList.add('table-container');
            table.style.maxHeight = '600px';
            table.style.overflowY = 'auto';

            const chartDataObj = chartData; // Assuming chartData is an object

            let tableHtml = '<table border="1">';
            tableHtml += '<table border="1">';
            tableHtml += '<thead><tr>';
       
            chartDataObj.datasets.forEach((dataset) => {
                tableHtml += `<th>${dataset.label}</th>`;
            });
            tableHtml += '</tr></thead>';
            tableHtml += '<tbody>';
            for (let i = 0; i < chartDataObj.datasets[0].values.length; i++) {
                tableHtml += '<tr>';
                chartDataObj.datasets.forEach((dataset) => {
                tableHtml += `<td>${dataset.values[i]}</td>`;
                });
                tableHtml += '</tr>';
            }
            tableHtml += '</tbody>';
            tableHtml += '</table>';

            table.innerHTML = tableHtml;
            chartWrapper.appendChild(table);
        } else {

        const chartContainer = document.createElement('div');
        chartContainer.classList.add('chart-container');

        const canvas = document.createElement('canvas');
        canvas.id = 'dynamic-chart-' + Date.now(); // Unique ID for each chart
        chartContainer.appendChild(canvas);

        const iconContainer = document.createElement('div');
        iconContainer.classList.add('icon-container');
        const expandBtn = document.createElement('button');
        expandBtn.classList.add('expand-btn');
        expandBtn.textContent = '+';
        expandBtn.onclick = function() {
            const existingExpandedView = chartContainer.querySelector('.expanded-view-options');
            if (existingExpandedView) {
              // If expanded view already exists, remove it
              existingExpandedView.parentNode.remove();
            } else {
              // Create and append expanded view
              const expandedView = document.createElement('div');
              expandedView.innerHTML = `
                <div class="expanded-view-options">
                  <button class="option-btn" id="dashboard-btn">Dashboard</button>
                  <button class="option-btn" id="iframe-btn">Iframe</button>
                  <button class="option-btn" id="img-btn">Img</button>
                </div>
              `;
          
              // Add event listeners to option buttons
              expandedView.querySelector('#dashboard-btn').addEventListener('click', () => {
                // Handle dashboard option click
                console.log('Dashboard option clicked');
              });
          
            //   expandedView.querySelector('#iframe-btn').addEventListener('click', () => {
            //     // Handle iframe option click
            //     console.log('Iframe option clicked');
            //   });
              
                expandedView.querySelector('#iframe-btn').addEventListener('click', async () => {
                // Get chart data from wrapper
                const chartType = chartWrapper.dataset.chartType;
                //const chartData = JSON.parse(chartWrapper.dataset.chartData);
                
                // Create loading indicator
                expandedView.innerHTML = `<div class="loading">Creating embed...</div>`;
                
                // Generate embeddable iframe
                const embedResult = await createEmbeddableIframe(embed_id);
                
                if (embedResult.error) {
                    expandedView.innerHTML = `<div class="error">${embedResult.error}</div>`;
                    return;
                }
                
                // Display iframe and controls
                expandedView.innerHTML = `
                    <div class="iframe-container">
                        <div class="iframe-preview">
                            ${embedResult.iframe}
                        </div>
                        <div class="embed-controls">
                            <h4>Embed Options</h4>
                            
                            <div class="embed-option">
                                <label>Direct Link:</label>
                                <input type="text" value="${embedResult.directLink}" readonly>
                                <button class="copy-btn" data-text="${embedResult.directLink}">Copy</button>
                            </div>
                            
                            <div class="embed-option">
                                <label>Embed Code:</label>
                                <textarea readonly>${embedResult.embedCode}</textarea>
                                <button class="copy-btn" data-text="${embedResult.embedCode}">Copy</button>
                            </div>
                            
                            <button class="close-btn">Close</button>
                        </div>
                    </div>
                `;
                
                // Add copy functionality
                expandedView.querySelectorAll('.copy-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const text = btn.dataset.text;
                        navigator.clipboard.writeText(text).then(() => {
                            const originalText = btn.textContent;
                            btn.textContent = 'Copied!';
                            setTimeout(() => {
                                btn.textContent = originalText;
                            }, 2000);
                        });
                    });
                });
                
                // Close button
                expandedView.querySelector('.close-btn').addEventListener('click', () => {
                    expandedView.remove();
                });
                });
            
          
              expandedView.querySelector('#img-btn').addEventListener('click', () => {
                // Handle img option click
                console.log('Img option clicked');
                const canvas = chartContainer.querySelector('canvas');
                const dataURL = canvas.toDataURL('image/png', 1.0); // high quality
                const link = document.createElement('a');
                link.href = dataURL;
                link.download = 'chart.png';
                link.click();
              });
          
              chartContainer.appendChild(expandedView);
            }
          };


        iconContainer.appendChild(expandBtn);

        chartWrapper.appendChild(chartContainer);
        chartWrapper.appendChild(iconContainer);
        
        msgBody.appendChild(chartWrapper);
        scrollToBottom();

        const ctx = canvas.getContext('2d');
    
        let config;
    
        switch (chartType) {
            case 'bar':
                config = createBarChartConfig(chartData);
                break;
            case 'line':
                config = createLineChartConfig(chartData);
                break;
            case 'radar':
                config = createRadarChartConfig(chartData);
                break;
            case 'donut':
                config = createDonutChartConfig(chartData);
                break;
            case 'barWithLine':
                config = createBarWithLineChartConfig(chartData);
                break;
            case 'barWithMultipleLine':
                config = createBarWithMultipleLineChartConfig(chartData);
                break;
            case 'stackBar':
                config = createStackedBarChartConfig(chartData);
                break;
            case 'pie':
                config = createPieChartConfig(chartData);
                break;
            default:
                console.warn(`Unsupported chart type: ${chartType}`);
                return; // Do not render anything
        }
    
        
        new Chart(ctx, config);
    }
    msgBody.appendChild(chartWrapper);
    scrollToBottom();
      
    }

    document.addEventListener('click', (e) => {
        const expandedViews = document.querySelectorAll('.expanded-view-options');
        if (expandedViews.length > 0 && !e.target.closest('.expanded-view-options') && !e.target.closest('.expand-btn')) {
          expandedViews.forEach((view) => view.remove());
        }
      });

    function createBarChartConfig(data) {
        return {
            type: 'bar',
            data: {
                labels: data.labels || ['Default Label'],
                datasets: [{
                    label: data.title,
                    data: data.values || [0],
                    backgroundColor: getRandomColor(),
                    borderColor: getRandomColor(),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    title: { display: true, text: data.title }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        };
    }

    function createBarWithLineChartConfig(data) {
        return {
            type: 'bar',
            data: {
                labels: data.labels || ['Default Label'],
                datasets: [
                    {
                        type: 'bar',
                        label: data.bar_name,
                        data: data.values || [0],
                        backgroundColor: getRandomColor()
                    },
                    {
                        type: 'line',
                        label: data.line_name,
                        data: data.lineValues || [0],
                        borderColor: getRandomColor(),
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true },
                    title: { display: true, text: data.title }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        };
    }

    function createStackedBarChartConfig(data) {
        return {
            type: 'bar',
            data: {
                labels: data.labels || ['Default Label'],
                datasets: data.datasets.map((dataset, index) => ({
                    label: dataset.label || `Dataset ${index + 1}`,
                    data: dataset.values || [0],
                    backgroundColor: getRandomColor(),
                    stack: 'combined'
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true },
                    title: { display: true, text: data.title }
                },
                scales: {
                    x: { stacked: true },
                    y: { stacked: true, beginAtZero: true }
                }
            }
        };
    }

    function createPieChartConfig(data) {
        return {
            type: 'pie',
            data: {
                labels: data.labels || ['Default Label'],
                datasets: [{
                    label: data.title,
                    data: data.values || [0],
                    backgroundColor: data.values.map(() => getRandomColor()),
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right' },
                    title: { display: true, text: data.title }
                }
            }
        };
    }

    function createBarWithMultipleLineChartConfig(data) {
        const labels = data.labels || ['Default Label'];
        const barValues = data.values || [0];
        const lineDatasets = data.line_datasets || [];
    
        const datasets = [
            {
                type: 'bar',
                label: data.bar_name,
                data: barValues,
                backgroundColor: getRandomColor(0.2), // Green for bars
                borderColor: getRandomColor(),
                borderWidth: 1
            },
            ...lineDatasets.map((lineData, index) => ({
                type: 'line',
                label: lineData.label || `Line ${index + 1}`,
                data: lineData.values || [0],
                borderColor: getRandomColor(),
                tension: 0.3,
                fill: false,
                pointRadius: 3
            }))
        ];
    
        return {
            type: 'bar',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true },
                    title: { display: true, text: data.title }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        };
    }
   
    function getRandomColordonut(opacity = 1) {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }

        if (opacity !== undefined && opacity !== 1) {
            return `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
        }

        return color;
    }

    function createDonutChartConfig(data) {
        return {
            type: 'doughnut',
            data: {
                labels: data.labels || ['Default Label'],
                datasets: [{
                    label: data.title,
                    data: data.values || [0],
                    backgroundColor: data.values.map(() => getRandomColordonut()),
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right' },
                    title: { display: true, text: data.title }
                }
            }
        };
    }

    function getRandomColor(opacity = 1) {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
    
        if (opacity !== undefined && opacity !== 1) {
            return `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
        }
    
        return color;
    }

    // function createRadarChartConfig(data) {
    //     return {
    //         type: 'radar',
    //         data: {
    //             labels: data.labels || ['Default Label'],
    //             datasets: [{
    //                 label: data.title,
    //                 data: data.values || [0],
    //                 backgroundColor: 'rgba(76, 175, 80, 0.2)',
    //                 borderColor: '#4CAF50',
    //                 pointBackgroundColor: '#4CAF50'
    //             }]
    //         },
    //         options: {
    //             responsive: true,
    //             maintainAspectRatio: false,
    //             plugins: {
    //                 legend: { display: false },
    //                 title: { display: true, text: data.title }
    //             },
    //             scales: {
    //                 r: {
    //                     beginAtZero: true
    //                 }
    //             }
    //         }
    //     };
    // }

    function createRadarChartConfig(data) {
        return {
            type: 'radar',
            data: {
                labels: data.labels || ['Default Label'],
                datasets: data.datasets.map((dataset, index) => ({
                    label: dataset.label || `Dataset ${index + 1}`,
                    data: dataset.values || [0],
                    backgroundColor: getRandomColor(0.2),
                    borderColor: getRandomColor(),
                    pointBackgroundColor: getRandomColor()
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true },
                    title: {
                        display: true,
                        text: data.title || 'Radar Chart'
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true
                    }
                }
            }
        };
    }

    function createLineChartConfig(data) {
        return {
            type: 'line',
            data: {
                labels: data.labels || ['Default Label'],
                datasets: data.datasets.map((dataset, index) => ({
                    label: dataset.label || `Dataset ${index + 1}`,
                    data: dataset.values || [0],
                    borderColor: getRandomColor(),
                    backgroundColor: getRandomColor(0.2), // Optional for fill
                    tension: 0.3,
                    fill: false
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true },
                    title: {
                        display: true,
                        text: data.title || 'Line Chart'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        };
    }


    domLoaded = true;
    console.log("domLoaded",domLoaded)

  
    document.getElementById('send-chat').addEventListener('click', sendMessage);


    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    });
});