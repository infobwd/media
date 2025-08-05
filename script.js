  $(document).ready(function() {
        $('#login-button').click(function() {
            liff.login();
        });

        $('#logout-button').click(function() {
            logout();
        });

        $('#share-button').click(function() {
            shareData();
        });

        $('#fullscreenButton').click(function() {
            toggleFullscreen();
        });

        $('#fontSizeButton').click(function() {
            toggleFontSize();
        });

        initializeLiff();
        loadStudentData();
        loadNewsData();

        setInterval(function() {
            loadStudentData($('#semesterDropdown').val());

        }, 30000); // Reload data every 30 seconds

        updateDateTime();
        setInterval(updateDateTime, 1000); // Update date and time every second
    });

async function initializeLiff() {
    try {
        await liff.init({ liffId: '2005494853-aVVwJPPd' });
        if (liff.isLoggedIn()) {
            await displayUserInfo();
            $('#login-button').hide(); // Hide login button after login
            loadWorkData(); // เพิ่มบรรทัดนี้
        }
    } catch (error) {
        console.error('LIFF initialization failed', error);
    }
}

let lineUID = ''; // เพิ่มตัวแปร global สำหรับเก็บ LINE UID

async function displayUserInfo() {
    try {
        const profile = await liff.getProfile();
        $('#profile-name').text(profile.displayName);
        $('#profile-picture').attr('src', profile.pictureUrl).show();
        $('#logout-button').show();
        $('#share-button').show();
        
        // เก็บ LINE UID และเรียกใช้ฟังก์ชัน setLineUID
        lineUID = profile.userId;
        setLineUID(lineUID);
    } catch (error) {
        console.error('Error getting profile', error);
    }
}

function setLineUID(uid) {
    lineUID = uid;
    console.log('LINE UID set:', lineUID);
    loadWorkData(); // โหลดข้อมูลงานใหม่เมื่อมีการ login
}

    // ฟังก์ชันสำหรับโหลดข้อมูลข้อมูลนักเรียนต่อครู
function loadStudentData(semester) {
    fetch('https://opensheet.elk.sh/1EZtfvb0h9wYZbRFTGcm0KVPScnyu6B-boFG6aMpWEUo/ข้อมูลนักเรียนต่อครู')
        .then(response => response.json())
        .then(data => {
            const selectedData = data.find(item => item['ปีการศึกษา'] === semester);
            if (!selectedData) return;

            const totalStudents = parseInt(selectedData['นักเรียนทั้งหมด'].replace(/,/g, ''));
            const maleStudents = parseInt(selectedData['นักเรียนชาย'].replace(/,/g, ''));
            const femaleStudents = parseInt(selectedData['นักเรียนหญิง'].replace(/,/g, ''));
            const classrooms = parseInt(selectedData['จำนวนห้องเรียน'].replace(/,/g, ''));
            const teachers = parseInt(selectedData['จำนวนครู'].replace(/,/g, ''));
            const teacherStudentRatio = parseFloat(selectedData['จำนวนครูต่อนักเรียน'].replace(/,/g, ''));

            const maleStudentsPercent = ((maleStudents / totalStudents) * 100).toFixed(2);
            const femaleStudentsPercent = ((femaleStudents / totalStudents) * 100).toFixed(2);

            document.getElementById('totalStudents').innerText = `${totalStudents} (คน)`;
            document.getElementById('maleStudents').innerText = `${maleStudents} (คน)`;
            document.getElementById('maleStudentsPercent').innerText = `${maleStudentsPercent}%`;
            document.getElementById('femaleStudents').innerText = `${femaleStudents} (คน)`;
            document.getElementById('femaleStudentsPercent').innerText = `${femaleStudentsPercent}%`;
            document.getElementById('classrooms').innerText = `${classrooms} (ห้อง)`;
            document.getElementById('teachers').innerText = `${teachers} (คน)`;
            document.getElementById('teacherStudentRatio').innerText = `1 ท่าน : นักเรียน ${teacherStudentRatio} คน`;
        });
}


   
    function shareData() {
        const profilePicture = $('#profile-picture').attr('src');
        const profileName = $('#profile-name').text();
        const currentDateTime = new Date().toLocaleString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            weekday: 'long',
            hour12: false
        });

              const electricityDataA = $('#electricityDataA').text();
              const electricityPercentA = $('#electricityPercentA').text();
              const electricityDataB = $('#electricityDataB').text();
              const electricityPercentB = $('#electricityPercentB').text();
              const electricityDataC = $('#electricityDataC').text();
              const electricityPercentC = $('#electricityPercentC').text();
              const electricityDataD = $('#electricityDataD').text();
              const electricityPercentD = $('#electricityPercentD').text();
              const electricityDataE = $('#electricityDataE').text();
              const electricityPercentE = $('#electricityPercentE').text();

              const waterDataA = $('#waterDataA').text();
              const waterPercentA = $('#waterPercentA').text();
              const waterDataB = $('#waterDataB').text();
              const waterPercentB = $('#waterPercentB').text();
              const waterDataC = $('#waterDataC').text();
              const waterPercentC = $('#waterPercentC').text();
              const waterDataD = $('#waterDataD').text();
              const waterPercentD = $('#waterPercentD').text();


        const flexMessage = {
            type: "flex",
            altText: "แหล่งน้ำดื่ม|แหล่งไฟฟ้า",
            contents: {
                type: "bubble",
                size: "giga",
                hero: {
                    type: "image",
                    url: "https://raw.githubusercontent.com/infobwd/STUDENT-CARE/main/headStudentCare2.png",
                    size: "full",
                    aspectRatio: "40:10",
                    aspectMode: "cover"
                },
                body: {
                    type: "box",
                    layout: "vertical",
                    contents: [
                        {
                            type: "separator",
                            margin: "xl"
                        },
                        {
                            type: "box",
                            layout: "vertical",
                            margin: "lg",
                            spacing: "sm",
                            contents: [
                                {
                                    type: "box",
                                    layout: "baseline",
                                    spacing: "sm",
                                    contents: [
                                        {
                                            type: "text",
                                            text: "ปีการศึกษา",
                                            color: "#aaaaaa",
                                            size: "sm",
                                            flex: 5
                                        },
                                        {
                                            type: "text",
                                            text: $('#semesterDropdown').val(),
                                            wrap: true,
                                            color: "#666666",
                                            size: "sm",
                                            flex: 5
                                        }
                                    ]
                                },
                                {
                                    type: "box",
                                    layout: "baseline",
                                    spacing: "sm",
                                    contents: [
                                        {
                                            type: "text",
                                            text: "ไม่มีไฟฟ้า",
                                            color: "#aaaaaa",
                                            size: "sm",
                                            flex: 5
                                        },
                                        {
                                            type: "text",
                                            text: `${electricityDataA} (${electricityPercentA})`,
                                            wrap: true,
                                            color: "#666666",
                                            size: "sm",
                                            flex: 5
                                        }
                                    ]
                                },
                                {
                                    type: "box",
                                    layout: "baseline",
                                    spacing: "sm",
                                    contents: [
                                        {
                                            type: "text",
                                            text: "มีไฟฟ้า",
                                            color: "#aaaaaa",
                                            size: "sm",
                                            flex: 5
                                        },
                                        {
                                            type: "text",
                                            text: `${electricityDataB} (${electricityPercentB})`,
                                            wrap: true,
                                            color: "#666666",
                                            size: "sm",
                                            flex: 5
                                        }
                                    ]
                                },
                                {
                                    type: "box",
                                    layout: "baseline",
                                    spacing: "sm",
                                    contents: [
                                        {
                                            type: "text",
                                            text: "ไฟบ้านหรือมิเตอร์",
                                            color: "#aaaaaa",
                                            size: "sm",
                                            flex: 5
                                        },
                                        {
                                            type: "text",
                                            text: `${electricityDataC} (${electricityPercentC})`,
                                            wrap: true,
                                            color: "#666666",
                                            size: "sm",
                                            flex: 5
                                        }
                                    ]
                                },
                                {
                                    type: "box",
                                    layout: "baseline",
                                    spacing: "sm",
                                    contents: [
                                        {
                                            type: "text",
                                            text: "เครื่องปั่นไฟ/โซลาเซลล์",
                                            color: "#aaaaaa",
                                            size: "sm",
                                            flex: 5
                                        },
                                        {
                                            type: "text",
                                            text: `${electricityDataD} (${electricityPercentD})`,
                                            wrap: true,
                                            color: "#666666",
                                            size: "sm",
                                            flex: 5
                                        }
                                    ]
                                },
                                {
                                    type: "box",
                                    layout: "baseline",
                                    spacing: "sm",
                                    contents: [
                                        {
                                            type: "text",
                                            text: "ไฟต่อพ่วง/แบตเตอรี่",
                                            color: "#aaaaaa",
                                            size: "sm",
                                            flex: 5
                                        },
                                        {
                                            type: "text",
                                            text: `${electricityDataE} (${electricityPercentE})`,
                                            wrap: true,
                                            color: "#666666",
                                            size: "sm",
                                            flex: 5
                                        }
                                    ]
                                } 
                            ]
                        },
                        {
                            type: "separator",
                            margin: "xl"
                        },
                        {
                            type: "box",
                            layout: "vertical",
                            margin: "lg",
                            spacing: "sm",
                            contents: [
                                {
                                    type: "box",
                                    layout: "baseline",
                                    spacing: "sm",
                                    contents: [
                                        {
                                            type: "text",
                                            text: "น้ำดื่มบรรจุขวด/ ตู้หยอดน้ำ",
                                            wrap: true,
                                            color: "#aaaaaa",
                                            size: "sm",
                                            flex: 5
                                        },
                                        {
                                            type: "text",
                                            text: `${waterDataA} (${waterPercentA})`,
                                            wrap: true,
                                            color: "#666666",
                                            size: "sm",
                                            flex: 5
                                        }
                                    ]
                                },
                                {
                                    type: "box",
                                    layout: "baseline",
                                    spacing: "sm",
                                    contents: [
                                        {
                                            type: "text",
                                            text: "น้ำประปา",
                                            color: "#aaaaaa",
                                            size: "sm",
                                            flex: 5
                                        },
                                        {
                                            type: "text",
                                            text: `${waterDataB} (${waterPercentB})`,
                                            wrap: true,
                                            color: "#666666",
                                            size: "sm",
                                            flex: 5
                                        }
                                    ]
                                },
                                {
                                    type: "box",
                                    layout: "baseline",
                                    spacing: "sm",
                                    contents: [
                                        {
                                            type: "text",
                                            text: "น้ำบ่อ/น้ำบาดาล",
                                            color: "#aaaaaa",
                                            size: "sm",
                                            flex: 5
                                        },
                                        {
                                            type: "text",
                                            text: `${waterDataC} (${waterPercentC})`,
                                            wrap: true,
                                            color: "#666666",
                                            size: "sm",
                                            flex: 5
                                        }
                                    ]
                                },
                                {
                                    type: "box",
                                    layout: "baseline",
                                    spacing: "sm",
                                    contents: [
                                        {
                                            type: "text",
                                            text: "น้ำฝน/น้ำประปาภูเขา/ลำธาร",
                                           wrap: true,
                                            color: "#aaaaaa",
                                            size: "sm",
                                            flex: 5
                                        },
                                        {
                                            type: "text",
                                            text: `${waterDataD} (${waterPercentD})`,
                                            wrap: true,
                                            color: "#666666",
                                            size: "sm",
                                            flex: 5
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                footer: {
                    type: "box",
                    layout: "vertical",
                    contents: [
                        {
                            type: "separator",
                            margin: "sm"
                        },
                        {
                            type: "image",
                            url: profilePicture,
                            size: "sm",
                            aspectMode: "cover",
                            aspectRatio: "1:1",
                            gravity: "bottom",
                            margin: "md"
                        },
                        {
                            type: "text",
                            text: "ข้อมูลโดย : " + profileName,
                            weight: "bold",
                            size: "sm",
                            align: "center"
                        },
                        {
                            type: "text",
                            text: "ข้อมูล ณ. " + currentDateTime,
                            size: "xs",
                            color: "#aaaaaa",
                            align: "center"
                        },
                        {
                            type: "button",
                            style: "secondary",
                            height: "sm",
                            action: {
                                type: "uri",
                                label: "App เยี่ยมบ้าน",
                                uri: "https://liff.line.me/2005230346-ND61qqrg"
                            },
                            style: "primary",
                            color: "#1DB446",
                            margin: "md"
                        },
                        {
                            type: "button",
                            style: "secondary",
                            height: "sm",
                            action: {
                                type: "uri",
                                label: "View More",
                                uri: "https://liff.line.me/2005494853-ZDznGqqe"
                            },
                            style: "primary",
                            color: "#1DB446",
                            margin: "md"
                        }
                    ],
                    spacing: "sm",
                    paddingTop: "10px"
                }
            }
        };

        liff.shareTargetPicker([flexMessage])
            .then(() => {
                liff.closeWindow();
            })
            .catch(function (error) {
                console.error('Error sending message: ', error);
            });
    }

    function loadNewsData() {
        fetch('https://opensheet.elk.sh/1EZtfvb0h9wYZbRFTGcm0KVPScnyu6B-boFG6aMpWEUo/ข่าวประกาศ')
            .then(response => response.json())
            .then(data => {
                let newsHtml = data.map(news => {
                    let date = news.วันที่.replace(' +0700', ''); // ตัดข้อความ "+0000" ออก
                    return `📰 <a href="${news.Link}" target="_blank">${news.หัวข้อข่าว}: 📆 (${date})</a>`;
                }).join(' | ');
                $('#newsTicker').html(newsHtml);
            });
    }

    function logout() {
        liff.logout();
        window.location.reload();
    }

    function chatFunction() {
        window.open('https://line.me/R/ti/p/@747spikt', '_blank');
    }

    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            $('#fullscreenButton').text('ย่อขนาดจอ');
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                $('#fullscreenButton').text('ขยายเต็มจอ');
            }
        }
    }

    function toggleFontSize() {
        let currentSize = parseInt($('body').css('font-size'));
        if (currentSize === 16) {
            $('body').css('font-size', '20px');
        } else if (currentSize === 20) {
            $('body').css('font-size', '24px');
        } else {
            $('body').css('font-size', '16px');
        }
    }

    function updateDateTime() {
        const currentDateTime = new Date().toLocaleString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            weekday: 'long',
            hour12: false
        });
        $('#currentDateTime').text(currentDateTime);
    }

function updateDOM(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value + (typeof value === 'number' ? ' งาน' : '');
    } else {
        console.error(`Element with id ${id} not found`);
    }
}

function updatePercentage(id, value, total) {
    const element = document.getElementById(id);
    if (element) {
        const percentage = total > 0 ? ((value / total) * 100).toFixed(2) : 0;
        element.textContent = percentage + '%';
    } else {
        console.error(`Element with id ${id} not found`);
    }
}