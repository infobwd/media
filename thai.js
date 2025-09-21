const SHEET_URL = 'https://opensheet.elk.sh/1EZtfvb0h9wYZbRFTGcm0KVPScnyu6B-boFG6aMpWEUo/สถิติคำอ่านปี 66';
const PERCENTAGE_THRESHOLD = 50;
let userData = {};
let currentFontSize = 1;
let swiper;

$(document).ready(function() {
    $("#nav-container").load("navRegistration.html", function() {
        console.log("Nav loaded");
        initializeNavButtons();
        initializeLiff();
    });
    $("#footer-container").load("footerRegis.html");
    fetchThaiData();
});

function initializeNavButtons() {
    console.log("Initializing nav buttons");
    $('#fullscreenButton').click(toggleFullscreen);
    $('#fontSizeButton').click(toggleFontSize);
    $('#login-button').click(() => liff.login());
    $('#logout-button').click(logout);
}

async function initializeLiff() {
    try {
        await liff.init({ liffId: '2005769714-jJv8WM2M' });
        if (liff.isLoggedIn()) {
            await displayUserInfo();
        } else {
            $('#login-button').show();
        }
    } catch (error) {
        console.error('LIFF initialization failed', error);
        alert('LIFF initialization failed: ' + error.message);
    }
}

async function displayUserInfo() {
    try {
        const profile = await liff.getProfile();
        $('#profile-name').text(profile.displayName);
        $('#profile-picture').attr('src', profile.pictureUrl).show();
        userData = {
            User_Id: profile.userId,
            DisplayName: profile.displayName,
            ProfileUrl: profile.pictureUrl,
            Status: profile.statusMessage,
            ImagePicture: profile.pictureUrl
        };
        $('#user-profile').show();
        $('#login-button').hide();
    } catch (error) {
        console.error('Error getting profile', error);
    }
}

function logout() {
    liff.logout();
    window.location.reload();
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
            console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

function toggleFontSize() {
    const elements = document.querySelectorAll('body, body *');
    currentFontSize = currentFontSize === 1 ? 1.2 : 1;
    elements.forEach(element => {
        element.style.fontSize = currentFontSize + 'em';
    });
}

function fetchThaiData() {
    fetch(SHEET_URL)
        .then(response => response.json())
        .then(data => {
            const filteredData = data.filter(row => {
                const percentage = parseFloat(row['ร้อยละ']);
                return !isNaN(percentage) && percentage < PERCENTAGE_THRESHOLD;
            });
            displayThaiWords(filteredData);
        })
        .catch(error => console.error('Error:', error));
}

function displayThaiWords(data) {
    const carouselWrapper = document.getElementById('word-carousel');
    carouselWrapper.innerHTML = ''; // Clear existing content
    data.forEach(row => {
        const word = row['Word'] || '';
        const percentage = row['ร้อยละ'] || 'N/A';
        const coloredWord = colorThaiWord(word);
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';
        slide.innerHTML = `
            <div class="word-card">
                <div class="word">${coloredWord}</div>
                <div class="percentage">ร้อยละ: ${percentage}</div>
            </div>
        `;
        carouselWrapper.appendChild(slide);
    });

    // Initialize Swiper
    swiper = new Swiper('.swiper', {
        slidesPerView: 1,
        spaceBetween: 30,
        loop: true,
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
    });
}

function colorThaiWord(word) {
    if (!word || typeof word !== 'string') return '';
    
    const consonants = 'กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรลวศษสหฬอฮ';
    const vowels = 'ะัาำิีึืุูเแโใไๅ';
    const tones = '่้๊๋';
    let isInitial = true;
    let hasVowel = false;
    return word.split('').map((char, index) => {
        if (consonants.includes(char)) {
            if (isInitial) {
                isInitial = false;
                return `<span class="initial">${char}</span>`;
            } else {
                return `<span class="final">${char}</span>`;
            }
        } else if (vowels.includes(char)) {
            hasVowel = true;
            return `<span class="vowel">${char}</span>`;
        } else if (tones.includes(char)) {
            return `<span class="tone">${char}</span>`;
        } else {
            if (index === word.length - 1 && !hasVowel) {
                return `<span class="final">${char}</span>`;
            }
            return char;
        }
    }).join('');
}

$('#chatBtn').click(function() {
    console.log('Chat button clicked');
    // Add your chat functionality here
});