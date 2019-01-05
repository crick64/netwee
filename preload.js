/* eslint-disable */
const { ipcRenderer } = require('electron');

let previousResult = undefined;

/**
 * Add a stylesheet rule to the document (it may be better practice
 * to dynamically change classes, so style information can be kept in
 * genuine stylesheets and avoid adding extra elements to the DOM).
 * Note that an array is needed for declarations and rules since ECMAScript does
 * not guarantee a predictable object iteration order, and since CSS is 
 * order-dependent.
 * @param {Array} rules Accepts an array of JSON-encoded declarations
 * @example
addStylesheetRules([
  ['h2', // Also accepts a second argument as an array of arrays instead
    ['color', 'red'],
    ['background-color', 'green', true] // 'true' for !important rules 
  ], 
  ['.myClass', 
    ['background-color', 'yellow']
  ]
]);
*/
function addStylesheetRules(rules) {
  var styleEl = document.createElement('style');

  // Append <style> element to <head>
  document.head.appendChild(styleEl);

  // Grab style element's sheet
  var styleSheet = styleEl.sheet;

  for (var i = 0; i < rules.length; i++) {
    var j = 1,
      rule = rules[i],
      selector = rule[0],
      propStr = '';
    // If the second argument of a rule is an array of arrays, correct our variables.
    if (Array.isArray(rule[1][0])) {
      rule = rule[1];
      j = 0;
    }

    for (var pl = rule.length; j < pl; j++) {
      var prop = rule[j];
      propStr +=
        prop[0] + ': ' + prop[1] + (prop[2] ? ' !important' : '') + ';\n';
    }

    // Insert CSS Rule
    styleSheet.insertRule(
      selector + '{' + propStr + '}',
      styleSheet.cssRules.length
    );
  }
}

function addClassNameListener(elemId, classNameToFind, callback) {
  var elem = document.getElementById(elemId);
  var lastClassname = elem.className;
  var interval = window.setInterval(function() {
    var className = elem.className;
    if (
      lastClassname !== className &&
      className.indexOf(classNameToFind) !== -1
    ) {
      lastClassname = className;
      //clearInterval(interval);
      callback();
    }
  }, 100);

  return interval;
}

document.addEventListener('click', event => {
  if (event.target.href) {
    // Open links in external browser
    //shell.openExternal(event.target.href);
    event.preventDefault();
  } else if (event.target.classList.contains('more-info-link')) {
    // show more info
    ipcRenderer.send('more-info-click');
  }
});

const sendNotification = result => {
  if (previousResult == null) {
    let notification = new Notification('Netwee', {
      // prettier-ignore
      body: parseInt(result.up) > 0 ? `Your current network speed is approx: ${result.down} Mbps Download - ${result.up} Mbps Upload.` : `Network download speed: ${result.down} Mbps. Click more detail to see upload speed.`
    });

    // Show window when notification is clicked
    notification.onclick = () => {
      ipcRenderer.send('show-window');
    };
  }
};

const updateResult = () => {
  const downloadSpeedEle = document.getElementById('speed-value');
  const uploadSpeedEle = document.getElementById('upload-value');
  const speedValue = downloadSpeedEle.innerHTML;
  const upValue = uploadSpeedEle ? uploadSpeedEle.innerHTML : '';

  sendNotification({ down: speedValue, up: upValue });
  ipcRenderer.send('set-title', { up: upValue, down: speedValue });
};

const addCloseButton = () => {
  let closeEle = document.createElement('span');

  closeEle.innerHTML = 'Quit';
  closeEle.classList.add('topleft');
  closeEle.classList.add('osxbutton');
  closeEle.onclick = function() {
    ipcRenderer.send('quit');
  };
  document.body.appendChild(closeEle);

  var css = `
    .topleft {
      position: absolute; top:2px;left:2px;
    }
    .osxbutton {
			text-decoration: none;
			font-family:".LucidaGrandeUI", "Lucida Grande", "Lucida sans unicode";
			color: black;
			font-size: 11px;
			padding: 1px 7px;
			border:1px solid #9C9C9C;
			margin: 2px 2px;
			display: inline-block;
			background-image: -webkit-linear-gradient(
			#ffffff 0%, #F6F6F6 	30%, 
			#F3F3F3 45%, #EDEDED 	60%, 
			#eeeeee 100%);
			border-radius: 3px;
			cursor: default;
			box-shadow: 0px 0px 1px rgba(0,0,0,0.20);
		}
		.osxbutton:active {
		 	border-color:#705ebb;
			background-image:-webkit-linear-gradient(
			#acc5e9 0%, 		#a3c0f2 18%, 
			#61a0ed 39%,		#55a3f2 70%, 
			#82c2f1 91.72%, 	#9AD2F2 100%); 
			box-shadow: 0px 0px 1px rgba(0,0,0,0.65);		
		}
		.osxbutton.disabled {
			color: #999!important;
			background-image: -webkit-linear-gradient(#fbf8f8 0%, #f0f0f0 30%, #e3e3e3 45%, #d7d7d7 60%, #cbc9c9 100%);
		}`;
  var style = document.createElement('style');

  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }

  document.getElementsByTagName('head')[0].appendChild(style);
};

const detectResult = () => {
  addClassNameListener('speed-progress-indicator', 'succeeded', updateResult);
  addStylesheetRules([['::-webkit-scrollbar', ['display', 'none']]]);

  addCloseButton();
};

// Refresh every 60 seconds
// const aMinutes = 1 * 60 * 1000;
// setInterval(detectResult, aMinutes);

// Update initial weather when loaded
document.addEventListener('DOMContentLoaded', detectResult);
