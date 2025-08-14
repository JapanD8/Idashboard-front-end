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
        fetch(`/rb/get_messages?${params}`, {
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
                    var converter = new showdown.Converter();
                    var html = converter.makeHtml(message.message);
                    const htmlmessage = marked.parse(message.message);
                    listItem.classList.add('sender');
                    listItem.innerHTML = `
                        ${htmlmessage}
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
        const connectionType = sessionStorage.getItem(dbId);
        const connectionTypeid = sessionStorage.getItem(connectionType+"_"+chatId);
        const schemadata = JSON.parse(storedData);

        const listItem = document.createElement('li');
        listItem.classList.add('repaly'); // Assuming user is the one replying
        //<span class="time">${formatTime(message.timestamp)}</span>
        listItem.innerHTML = `
            <p>${message}</p>
        `;
        msgBody.appendChild(listItem);
        scrollToBottom();
        // Send the message to the endpoint


        // Show "searching..." or spinner
        const loadingListItem = document.createElement('li');
        loadingListItem.classList.add('sender');
        loadingListItem.classList.add('loading');
        loadingListItem.innerHTML = `<em style="margin-left: 5px;">Searching<span class="dotting">...</span></em>`;
        msgBody.appendChild(loadingListItem);
        scrollToBottom();

        let selectedSids = Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map(checkbox => checkbox.dataset.sid).filter(sid => sid !== undefined);
        console.log("selectedSids",selectedSids);
       
        fetch('/rb/chat_ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId, message: message, dbId:dbId, fileIds: selectedSids, ctype: connectionType, typeid:connectionTypeid})
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const responseData = data.data;
                console.log( data.data, data.data)
                // Create a new message element for the response
                const htmlmessage = marked.parse(data.data.message);
                // const listItem = document.createElement('li');
                // listItem.classList.add('sender');
                // listItem.innerHTML = `
                //     ${htmlmessage}
                // `;
                loadingListItem.innerHTML = htmlmessage;
                // msgBody.appendChild(listItem);
                // scrollToBottom();
                
            } else {
                console.error('Error fetching data');
            }
        })
        .catch(error => console.error(error));
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