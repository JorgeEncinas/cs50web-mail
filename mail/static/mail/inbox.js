document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  const compose_form =document.querySelector("#compose-form")
  compose_form.addEventListener("submit", send_email)
  compose_form.method = "POST"
  compose_form.action="/emails"

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  show_view('emails-view')

  // Show the mailbox name
  let emails_view = document.querySelector('#emails-view')
  emails_view.innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>
  <div class="container-fluid">
    <div class="row justify-content-end">
      <h6 class="col-sm-2 col-xs-1">Mark as Read</h6>
      <h6 class="col-sm-2 col-xs-1">Archive</h6>
    </div>
  </div>
  <div id="emails-content"></div>`


  // Load the mailbox data.
  fetch(`/emails/${mailbox}`, {
    method: "GET"
  })
  .then(response => response.json())
  .then(emails => {
    //console.log(emails)
    let containerDiv = document.createElement("div")
    containerDiv.className = "container-fluid"
    emails.forEach(email => {
      let rowDiv = document.createElement("div")
      let tempAnchor = document.createElement("div")
      //Idea of eventListener using TARGET is from https://stackoverflow.com/a/11986895
      tempAnchor.addEventListener("click", get_email)
      tempAnchor.email_id = email.id
      let recipient_string = email.recipients[0]
      if (Object.keys(email.recipients).length > 1) {
        recipient_string = recipient_string + " ..."
      }
      if(email.read) {
        email_bgcolor = "bg-gray"
      } else {
        email_bgcolor = "bg-white"
      }
      rowDiv.className=`${email_bgcolor} row mailAnchor col-sm-12 col-xs-12 `
      rowDiv.id = `email-${email.id}`
      tempAnchor.className=`col-sm-8 col-xs-8`
      tempAnchor.innerHTML = `
        <h5><b>${email.sender}</b></h5><p>Sent to ${recipient_string}</p>
        <p>${email.subject}</p><p>${email.timestamp}</p>
      `
      let tempBtns = document.createElement("div")
      tempBtns.className="col-sm-4 col-xs-4"
      tempBtns.innerHTML = `
        <div class="row">
          <div class="col-sm-6 col-xs-6">
            <input type="checkbox" id="mark_read" onclick="change_read_status(${email.id}, ${email.read})" ${email.read ? 'checked' : ''}>
          </div>
          <div class="col-sm-6 col-xs-6">
            <input type="checkbox" id="mark_archived" onclick="change_archive_status(${email.id}, ${email.archived})" ${email.archived ? 'checked' : ''}>
          </div>
        </div>
      `
      rowDiv.appendChild(tempAnchor)
      rowDiv.appendChild(tempBtns)
      containerDiv.appendChild(rowDiv)
    })
    let emails_content = document.getElementById("emails-content")
    emails_content.innerHTML = ""
    emails_content.append(containerDiv)
  })
  .catch(error =>{
    set_alert("danger", "Error: server response timed out")
    console.log(`error is ${error}`)
  })
}

function send_email(event) {
  event.preventDefault(); //This worked, my other idea was to put "return send_mail()" on the layout.html button
  let compose_recipients = document.getElementById("compose-recipients").value
  let compose_subject = document.getElementById("compose-subject").value
  let compose_body = document.getElementById("compose-body").value
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients:compose_recipients,
      subject:compose_subject,
      body:compose_body
    })
  })
  .then(response => response.json())
  .then(response => {
    if (response.status == undefined) {
      set_alert("danger", response.error)
    } else {
      set_alert("success", "E-mail has been sent!")
    }
    load_mailbox('sent')
  })
  .catch(error => {
    set_alert("danger", "Error: server response timed out.")
    console.log(error)
  })
  return false;
}

function change_archive_status(email_id, current_status) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: !current_status
    })
  })
  .then((response) => {
    if (response.status === 204) {
      set_alert("success", "Archive status changed successfully")
      if(document.getElementById('emails-view').style.display == "block") {
        let emailDiv = document.getElementById(`email-${email_id}`)
        //emailDiv.style.animationPlayState = 'running';
        //emailDiv.addEventListener('animationend', () => {
        //  emailDiv.remove()
        //})
        emailDiv.remove()
      }
    } else {
      set_alert("warning", response.statusText)
    }
  })
  .catch(error => {
    set_alert("danger", "Error: server response timed out.")
    console.log("error: ", error)
  })
}

function change_read_status(email_id, current_status) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: (!current_status)
    })
  })
  .then((response) => {
    if (response.status == 204) {
      let emailDiv = document.getElementById(`email-${email_id}`)
      if(emailDiv.style.backgroundColor = "white") {
        emailDiv.style.background = "#dbdbdb";
      } else {
        emailDiv.style.background = "white";
      }
      set_alert("success", `changed email "read" state `)
    } else {
      set_alert("warning", "something went wrong")
    }
  })
  .catch(error => {
    console.log("error: ", error)
  })
}

async function set_alert(className, message) {
  let alert_area = document.getElementById("alert-area")
  alert_area.className = `alert alert-${className}`
  alert_area.role = `alert`
  alert_area.innerHTML = message
  alert_area.style.display = 'block';

  await new Promise(resolve => setTimeout(resolve, 3000))
  alert_area.style.display = 'none';
}

//This is from this answer: https://stackoverflow.com/a/39914235
//I wanted to use a timeout before disappearing the alert
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function get_email(e){
  document.querySelector("#open-email-view").innerHTML = "";
  email_id = e.currentTarget.email_id
  //show_view('open-email-view');
  fetch(`/emails/${email_id}`, {
    method:"GET"
  })
  .then(response => response.json())
  .then(email => {
    if(email.status === 404) {
      set_alert("warning", "E-mail not found")
    } else {
      let emailDiv = document.createElement("div")
      recipient_string = gen_recipient_string(email.recipients)
      emailDiv.innerHTML = `
      <h5>From: <span id="email-sender">${email.sender}</span> on <span id="email-timestamp">${email.timestamp}</span></h5>
      <div id="archive-btn-space">
        <label>Archived:  </label><input type="checkbox" id="archive-check" onclick="change_archive_status(${email.id}, ${email.archived})">
      </div> <br>
      <h6>Sent to: <span id="email-recipient-string">${recipient_string}</span></h6>
      <h6>Subject: <span id="email-subject">${email.subject}</span></h6>
      <h6>CONTENT</h6>
      <p id="email-body">${email.body}</p>
      <button onclick="reply(${email.id})">Reply</button>
      `
      document.getElementById('open-email-view').appendChild(emailDiv)
      if(email.archive) {
        document.getElementById('archive-check').checked = true
      }
      show_view('open-email-view');
      if (!email.read) {
        change_read_status(email.id, email.read)
      }
    }
  })
  .catch(error => {
    set_alert("danger", "Error: server response timed out.")
  })
  return false;
}

function show_view(view_id) {
    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#open-email-view').style.display = 'none';
    //document.querySelector('#alert-area').style.display = 'none';
    document.querySelector(`#${view_id}`).style.display = 'block';

}

function gen_recipient_string(recipients) {
  let recipient_string = ""
  for(let i = 0; i<=recipients.length-2; i++) {
    recipient_string = recipient_string + recipients[i] + ", "
  }
  recipient_string = recipient_string + recipients[recipients.length-1]
  return recipient_string
}

function reply(email_id) {
  let og_email_sender = document.getElementById("email-sender").innerHTML
  let og_email_subject = document.getElementById("email-subject").innerHTML
  let og_email_body = document.getElementById("email-body").innerHTML
  let og_email_timestamp = document.getElementById("email-timestamp").innerHTML
  document.querySelector('#compose-recipients').value = og_email_sender
  let email_body = ""
  if (og_email_subject.substring(0, 4).toLowerCase() !== "re: ") {
    og_email_subject = "Re: " + og_email_subject
    
  }
  email_body = `On ${og_email_timestamp}, ${og_email_sender} wrote: \n\n` + og_email_body + `\n\n` +
  `------------------------------------------------------\n\n`
  let compose_subject = document.querySelector('#compose-subject')
  compose_subject.value = og_email_subject
  let compose_body = document.querySelector('#compose-body')
  compose_body.value = email_body
  show_view('compose-view')
  compose_body.focus()
}