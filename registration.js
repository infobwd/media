let userData = {};
let qrCodeImage = '';
let currentFontSize = 1;
let currentEventId = null; // ตัวแปรเพื่อเก็บ eventId

function initializeNavButtons() {
    $('#fullscreenButton').click(toggleFullscreen);
    $('#fontSizeButton').click(toggleFontSize);
    $('#login-button').click(() => liff.login());
    $('#logout-button').click(logout);
    $('#share-button').click(shareRegistrationData);
}

$(document).ready(function() {
    $("#nav-container").load("navRegistration.html", function() {
        if (typeof initializeNavButtons === "function") {
            initializeNavButtons();
        } else {
            console.error("Function initializeNavButtons is not defined");
        }
        initializeLiff();
    });
    $("#footer-container").load("footerRegis.html");

    loadEventList();
    loadSchoolList();

    $('#registration-form').submit(function(e) {
        e.preventDefault();
        showLoading();
        submitRegistration();
    });

    $('#event-dropdown').change(function() {
        const eventId = $(this).val();
        if (eventId) {
            currentEventId = eventId; // เก็บค่า eventId เมื่อผู้ใช้เลือก
            checkRegistration(eventId);
        }
    });

    $('#edit-button').click(function() {
        if (currentEventId) {
            doGetUserRegistration(currentEventId);
        } else {
            showToast('กรุณาเลือกรายการก่อนแก้ไขข้อมูล', 'error');
        }
    });

    $('#back-button').click(function() {
        window.history.back();
    });

    // ตรวจสอบว่ามีการเพิ่มข้อมูลใหม่และต้องแสดงผลหรือไม่
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('showNewRegistration') === 'true') {
        const newRegistration = localStorage.getItem('newRegistration');
        if (newRegistration) {
            const formData = JSON.parse(newRegistration);
            displayRegistrationTable(formData);
            localStorage.removeItem('newRegistration'); // ลบข้อมูลออกจาก localStorage หลังจากใช้งาน
        }
    }

    if (urlParams.get('showUpdatedRegistration') === 'true') {
        showUpdatedRegistration();
        $('#edit-button').hide();
        $('#back-button').show();
        $('#registration-form').hide();
        $('#registration-title').hide();
        $('#registration-table-container').show();
    } else {
        $('#back-button').hide();
    }
});

async function initializeLiff() {
    try {
        await liff.init({ liffId: '2005769714-jJv8WM2M' });
        if (liff.isLoggedIn()) {
            await displayUserInfo();
            $('#login-button').hide();
            $('#user-profile').show();
        } else {
            liff.login();
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
        generateQRCode(profile.userId);
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

function generateQRCode(userId) {
    qrCodeImage = `https://api.qrserver.com/v1/create-qr-code/?data=${userId}&size=128x128`;
}

function loadEventList() {
    fetch('https://opensheet.elk.sh/1EZtfvb0h9wYZbRFTGcm0KVPScnyu6B-boFG6aMpWEUo/Event')
        .then(response => response.json())
        .then(data => {
            const dropdown = $('#event-dropdown');
            dropdown.empty();
            dropdown.append('<option value="">เลือกรายการ</option>');
            data.forEach(event => {
                dropdown.append(`<option value="${event.ID}" data-evaluation-link="${event['ลิงก์แบบประเมิน']}" data-exam-link="${event['ลิงก์ข้อสอบ']}" data-certificate-link="${event['ลิงก์เกียรติบัตร']}">${event['ชื่องาน']}</option>`);
            });
        })
        .catch(error => console.error('Error loading event list:', error));
}

function loadSchoolList() {
    fetch('https://opensheet.elk.sh/1EZtfvb0h9wYZbRFTGcm0KVPScnyu6B-boFG6aMpWEUo/รายชื่อโรงเรียน')
        .then(response => response.json())
        .then(data => {
            const schoolDropdown = $('#school');
            schoolDropdown.empty();
            schoolDropdown.append('<option value="">เลือกโรงเรียน</option>');
            data.forEach(school => {
                schoolDropdown.append(`<option value="${school['โรงเรียน']}">${school['โรงเรียน']}</option>`);
            });
        })
        .catch(error => console.error('Error loading school list:', error));
}

function checkRegistration(eventId) {
    fetch(`https://opensheet.elk.sh/1EZtfvb0h9wYZbRFTGcm0KVPScnyu6B-boFG6aMpWEUo/ลงทะเบียน`)
        .then(response => response.json())
        .then(data => {
            const registration = data.find(reg => reg.EventID === eventId && reg.User_Id === userData.User_Id);
            if (registration) {
                Swal.fire({
                    title: 'แจ้งเตือน',
                    text: 'ท่านได้ทำการลงทะเบียนแล้ว',
                    icon: 'info',
                    showCancelButton: true,
                    confirmButtonText: 'แก้ไขข้อมูลการลงทะเบียน',
                    cancelButtonText: 'ดูข้อมูลการลงทะเบียน'
                }).then((result) => {
                    if (result.isConfirmed) {
                        window.location.href = `edit.html?eventId=${eventId}`;
                    } else {
                        // นำไปยังหน้า data_event.html
                        window.location.href = 'data_event.html';
                    }
                });
            } else {
                $('#registration-form').show();
                $('#registration-table-container').hide();
                $('#registration-title').show();
            }
        })
        .catch(error => console.error('Error checking registration:', error));
}

function submitRegistration() {
    const eventDropdown = $('#event-dropdown');
    const selectedEvent = eventDropdown.find('option:selected');
    const eventId = selectedEvent.val();

    // ดึงข้อมูลจาก Event sheet
    fetch(`https://opensheet.elk.sh/1EZtfvb0h9wYZbRFTGcm0KVPScnyu6B-boFG6aMpWEUo/Event`)
        .then(response => response.json())
        .then(eventData => {
            const event = eventData.find(e => e.ID === eventId);
            if (event) {
                const formData = {
                    EventID: eventId,
                    คำนำหน้า: $('#prefix').val(),
                    ชื่อ: $('#firstname').val(),
                    สกุล: $('#lastname').val(),
                    โรงเรียน: $('#school').val(),
                    'วันที่และเวลา': new Date().toLocaleString('th-TH'),
                    ...userData,
                    QRcodeUser_Id: qrCodeImage,
                    EvaluationLink: event['ลิงก์แบบประเมิน'],
                    ExamLink: event['ลิงก์ข้อสอบ'],
                    CertificateLink: event['ลิงก์เกียรติบัตร']
                };
                console.log(formData); // เพิ่มบรรทัดนี้ก่อนการ fetch เพื่อดูข้อมูล

                fetch('https://script.google.com/macros/s/AKfycbwWUD2wYDwcvq2DXJsui-CnzkczYMfMSyutru8tWilNhNoAU0NULl39EFa9qab0AUs-Mw/exec', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                })
                .then(response => response.json())
                .then(data => {
                    hideLoading();
                    if (data.result === 'success') {
                        showToast('ลงทะเบียนสำเร็จ', 'success');
                        $('#registration-form')[0].reset();
                        displayRegistrationTable(formData);
                        $('#registration-form').hide();
                        $('#registration-title').hide();
                    } else {
                        showToast('เกิดข้อผิดพลาดในการลงทะเบียน', 'error');
                    }
                })
                .catch(error => {
                    hideLoading();
                    console.error('Error:', error);
                    showToast('เกิดข้อผิดพลาดในการลงทะเบียน', 'error');
                });
            } else {
                hideLoading();
                showToast('ไม่พบข้อมูลกิจกรรมที่เลือก', 'error');
            }
        })
        .catch(error => {
            hideLoading();
            console.error('Error:', error);
            showToast('เกิดข้อผิดพลาดในการดึงข้อมูลกิจกรรม', 'error');
        });
}



function showUpdatedRegistration() {
    const updatedRegistration = localStorage.getItem('updatedRegistration');
    if (updatedRegistration) {
        const formData = JSON.parse(updatedRegistration);
        currentEventId = formData.EventID; // เก็บค่า eventId ที่อัปเดต
        displayRegistrationTable(formData, true); // ส่งค่า true เพื่อแสดงปุ่ม "กลับไปหน้าก่อนหน้า"
        localStorage.removeItem('updatedRegistration'); // ลบข้อมูลออกจาก localStorage หลังจากใช้งาน
        $('#content-section').hide();
        $('#registration-table-container').show();
    }
}

function showRegistrationInfo(registration) {
    const formData = {
        EventID: registration.EventID,
        คำนำหน้า: registration.คำนำหน้า,
        ชื่อ: registration.ชื่อ,
        สกุล: registration.สกุล,
        โรงเรียน: registration.โรงเรียน,
        QRcodeUser_Id: registration.QRcodeUser_Id,
        ProfileUrl: userData.ProfileUrl,
        'วันที่และเวลา': registration['วันที่และเวลา']
    };

    displayRegistrationTable(formData);
    $('#registration-form').hide();
    $('#registration-title').hide();
    $('#edit-button').show();
}

function doGetUserRegistration(eventId) {
    const userId = userData.User_Id;
    fetch(`https://opensheet.elk.sh/1EZtfvb0h9wYZbRFTGcm0KVPScnyu6B-boFG6aMpWEUo/ลงทะเบียน?EventID=${eventId}&User_Id=${userId}`)
        .then(response => response.json())
        .then(data => {
            const registration = data.find(reg => reg.User_Id === userId);
            if (registration) {
                // Redirect to edit.html with the latest data
                const url = `edit.html?eventId=${eventId}`;
                window.location.href = url;
            } else {
                showToast('ไม่พบข้อมูลการลงทะเบียน', 'error');
            }
        })
        .catch(error => console.error('Error loading user registration:', error));
}

function displayRegistrationTable(formData, isUpdated = false) {
    $('#registration-table-container').show();
    $('#registration-info').empty();

    const qrCodeElement = `
        <div class="text-center mb-3">
            <img src="${formData.QRcodeUser_Id}" alt="QR Code" style="width: 200px; height: 200px;">
        </div>
    `;

    const registrationInfo = `
        <div class="registration-details card p-3 mb-3">
            <p class="small text-muted text-center">บัตรเข้างาน</p>
            ${qrCodeElement}
            <p><strong>คำนำหน้า:</strong> ${formData.คำนำหน้า}</p>
            <p><strong>ชื่อ:</strong> ${formData.ชื่อ}</p>
            <p><strong>นามสกุล:</strong> ${formData.สกุล}</p>
            <p><strong>โรงเรียน:</strong> ${formData.โรงเรียน}</p>
            <p><strong>วันที่และเวลา:</strong> ${formData['วันที่และเวลา']}</p>
            <div class="profile-picture text-center">
                <img src="${formData.ProfileUrl || userData.ProfileUrl}" alt="Profile Picture" class="rounded-circle" style="width: 100px; height: 100px;">
            </div>
        </div>
    `;

    $('#registration-info').append(registrationInfo);
    $('#edit-button').show();
    $('#registration-form').hide();
    $('#registration-title').hide();

    let buttonHtml = `
        <div class="text-center mt-3">
                <button id="back-button" class="btn btn-secondary">กลับไปหน้าก่อนหน้า</button>
        </div>
    `;

    if (isUpdated) {
        buttonHtml = `
            <div class="text-center mt-3">
                <button id="back-button" class="btn btn-secondary">กลับไปหน้าก่อนหน้า</button>
            </div>
        `;
    }

    $('#registration-list-container').html(buttonHtml);
}

function viewUserRegistrations(userId) {
    fetch('https://opensheet.elk.sh/1EZtfvb0h9wYZbRFTGcm0KVPScnyu6B-boFG6aMpWEUo/ลงทะเบียน')
        .then(response => response.json())
        .then(data => {
                  console.log("All registration data:", data); // เพิ่มบรรทัดนี้

            const userRegistrations = data.filter(reg => reg.User_Id === userId);
                  console.log("Filtered user registrations:", userRegistrations); // เพิ่มบรรทัดนี้

            if (userRegistrations.length > 0) {
                fetch('https://opensheet.elk.sh/1EZtfvb0h9wYZbRFTGcm0KVPScnyu6B-boFG6aMpWEUo/Event')
                    .then(eventResponse => eventResponse.json())
                    .then(eventData => {
                        const eventMap = {};
                        eventData.forEach(event => {
                            eventMap[event.ID] = event['ชื่องาน'];
                        });

                        generateRegistrationTable(userRegistrations, eventMap);
                    })
                    .catch(error => console.error('Error loading event data:', error));
            } else {
                showToast('ไม่พบข้อมูลการลงทะเบียน', 'error');
            }
        })
        .catch(error => console.error('Error loading user registrations:', error));
}

function generateRegistrationTable(registrations, eventMap) {
    let tableHtml = `
        <table id="registrationTable" class="table table-striped" style="width:100%">
            <thead>
                <tr>
                    <th>ลำดับ</th>
                    <th>ชื่อกิจกรรม</th>
                    <th>รูปภาพ</th>
                    <th>ลิงก์แบบประเมิน</th>
                    <th>บัตรประจำตัว</th>
                </tr>
            </thead>
            <tbody>
    `;

    registrations.forEach((reg, index) => {
        console.log("Processing registration:", reg);

        const evaluationLink = reg['ลิงก์แบบประเมิน'];
        console.log("Evaluation Link:", evaluationLink);

        const hasEvaluationLink = evaluationLink && evaluationLink.trim() !== '';

        const evaluationLinkWithParams = hasEvaluationLink
            ? `${evaluationLink}?user_id=${encodeURIComponent(reg.User_Id)}&prefix=${encodeURIComponent(reg.คำนำหน้า)}&firstname=${encodeURIComponent(reg.ชื่อ)}&lastname=${encodeURIComponent(reg.สกุล)}&school=${encodeURIComponent(reg.โรงเรียน)}` 
            : '#';
        
        tableHtml += `
            <tr>
                <td>${index + 1}</td>
                <td>${eventMap[reg.EventID] || 'ไม่พบข้อมูล'}</td>
                <td><img src="${reg.ProfileUrl || 'https://via.placeholder.com/40'}" alt="Profile Picture" class="rounded-circle" width="40" height="40"></td>
                <td>${hasEvaluationLink ? `<a href="${evaluationLinkWithParams}" target="_blank">ลิงก์แบบประเมิน</a>` : 'ไม่มีลิงก์'}</td>
                <td><button class="btn btn-info" onclick="showRegistrationInfo('${encodeURIComponent(JSON.stringify(reg))}', '${eventMap[reg.EventID] || 'ไม่พบข้อมูล'}')">ดูข้อมูล</button></td>
            </tr>
        `;
    });

    tableHtml += `
            </tbody>
        </table>
    `;

    $('#registration-list-container').html(tableHtml);
    $('#registrationTable').DataTable({
        dom: 'Bfrtip',
        responsive: true,
        buttons: [
            'copy', 'csv', 'excel', 'print'
        ],
        language: {
            url: 'https://cdn.datatables.net/plug-ins/1.10.24/i18n/Thai.json'
        },
        createdRow: function(row, data, dataIndex) {
            $(row).find('td').css('text-align', 'left');
        },
        order: [[1, 'asc']], // Sort by the second column (ชื่อกิจกรรม) in ascending order
        ordering: true // enable ordering
    });
}






// Function to handle the go to registration page button click
$(document).on('click', '#go-to-registration-page', function() {
    window.location.href = 'registration.html';
});

// Function to handle the go to registration page button click
$(document).on('click', '#go-to-registration-page', function() {
    window.location.href = 'registration.html';
});

// Function to handle the view registration button click
$(document).on('click', '#view-registration-button', function() {
    // window.location.href = 'registration.html?showUpdatedRegistration=true';
      window.location.href = 'registration.html';

});

// Handle back button click
$(document).on('click', '#back-button', function() {
    window.history.back();
});

function showToast(message, type) {
    const toastElement = $('<div class="toast" role="alert" aria-live="assertive" aria-atomic="true">')
        .addClass(`bg-${type === 'success' ? 'success' : 'danger'} text-white`)
        .append($('<div class="toast-body">').text(message));

    $('#toast-container').append(toastElement);
    const toast = new bootstrap.Toast(toastElement[0]);
    toast.show();

    setTimeout(() => {
        toast.hide();
        setTimeout(() => toastElement.remove(), 500);
    }, 3000);
}

function shareRegistrationData() {
    const profilePicture = $('#profile-picture').attr('src');
    const profileName = $('#profile-name').text();
    const currentDateTime = new Date().toLocaleString('th-TH', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        weekday: 'long', hour12: false
    });

    const eventName = $('#event-dropdown option:selected').text();
    const eventLink = "https://liff.line.me/2005769714-jJv8WM2M";

    const flexMessage = {
        type: "flex",
        altText: "ข้อมูลการลงทะเบียน",
        contents: {
            type: "bubble",
            size: "giga",
            hero: {
                type: "image",
                url: "https://raw.githubusercontent.com/infobwd/wdconnect/main/head%20meet.png",
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
                                        text: "กิจกรรม",
                                        color: "#aaaaaa",
                                        size: "sm",
                                        flex: 5
                                    },
                                    {
                                        type: "text",
                                        text: eventName,
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
                                        text: "ลิงก์กิจกรรม",
                                        color: "#aaaaaa",
                                        size: "sm",
                                        flex: 5
                                    },
                                    {
                                        type: "text",
                                        text: eventLink,
                                        wrap: true,
                                        color: "#666666",
                                        size: "sm",
                                        flex: 5,
                                        action: {
                                            type: "uri",
                                            label: "View More",
                                            uri: eventLink
                                        }
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
                            label: "คลิกเพื่อลงทะเบียน",
                            uri: eventLink
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

function showLoading() {
    $('#loadingModal').modal('show');
}

function hideLoading() {
    $('#loadingModal').modal('hide');
}