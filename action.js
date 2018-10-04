function run() {

	// Copies given text string to the browser clipboard.
	// May not work everywhere.
	function copyTextToClipboard(text) {
		if (!navigator.clipboard) {
			// Fall back to the older style.
			var textArea = document.createElement("textarea");
			textArea.value = text;
			document.body.appendChild(textArea);
			textArea.focus();
			textArea.select();

			try {
				var successful = document.execCommand('copy');
				var msg = successful ? 'successful' : 'unsuccessful';
				console.log('Fallback: Copying text command was ' + msg);
			} catch (err) {
				console.error('Fallback: Oops, unable to copy', err);
			}

			document.body.removeChild(textArea);
			return;
		}
		navigator.clipboard.writeText(text)
			.then(function () { }, function (err) {
				console.error('Async: Could not copy text: ', err);
			});
	}

	// Creates a data structure that is used for the 6 ways of processing
	// the lists. Binds the click handler for the buttons as well.
	function createData(id, doButton) {
		// Grab the element by id
		var el = document.getElementById(id);
		var data = {
			el: document.getElementById(id),
			// Will store the raw text, if needed
			text: "",
			// Text split by line
			lines: []
		}
		// If we have a button, add a closure to grab the text
		if (doButton) {
			var button = el.querySelector("[data-js-copy]");
			button.addEventListener("click", function () {
				copyTextToClipboard(data.text);
			});
		}
		return data;
	}

	// Our UI / data all in one. simple enough.
	var a = {
		desc: document.getElementById("js-a-desc"),
		textarea: createData("js-a-text"),
		unique: createData("js-a-unique", true),
		dupes: createData("js-a-dupes", true),
		stripped: createData("js-a-stripped", true),
	};
	var compare = {
		desc: document.getElementById("js-compare-desc"),
		textarea: createData("js-compare-text"),
		aNotB: createData("js-compare-a-not-b", true),
		bNotA: createData("js-compare-b-not-a", true),
		aAndB: createData("js-compare-a-and-b", true),
	}

	// Splits raw text into individual lines, removes empty lines.
	function splitAndFilter(text) {
		var lines = text.split("\n");
		return lines.filter(function (a) {
			return !!a;
		});
	}

	// Finds the duplicates in a single array. Requires sorted array first!
	function findDuplicates(lines) {
		var dupes = [];
		var nondupes = [];

		for (var i = 0; i < lines.length; i++) {
			var line = lines[i];
			var isEqual = false;
			while (i < lines.length && line === lines[i + 1]) {
				isEqual = true;
				i++;
			}
			if (isEqual)
				dupes.push(line);
			else
				nondupes.push(line);
		}

		return {
			dupes: dupes,
			nondupes: nondupes
		}
	}

	// Updates the UI by setting the text lines to be copied and the number of lines on the button text.
	function updateUI(data, lines) {
		var button = data.el.querySelector("[data-js-copy]");
		var count = data.el.querySelector("[data-js-count]");
		data.lines = lines;
		data.text = lines.join("\n");
		count.innerHTML = lines.length;
		if (lines.length) {
			button.disabled = false;
		}
		else {
			button.disabled = true;
		}
	}

	// I thought of this like a Venn Diagram, but use whatever name you like.
	// Essentially, it creates 3 arrays: A only, B only, and A and B.
	function vennAB(a, b) {
		// A and B are already sorted arrays of strings.
		// Figure out what's only in A, what's only in B, and what is in both.
		var onlyInA = [];
		var onlyInB = [];
		var inBoth = [];

		var aIndex = 0;
		var bIndex = 0;
		var previousMatch = null;
		while (aIndex < a.length && bIndex < b.length) {
			var aLine = a[aIndex];
			var bLine = b[bIndex];
			if (aLine === previousMatch) {
				// A is the same as previous A === B - so just increment A.
				aIndex++;
			}
			else if (bLine === previousMatch) {
				// B is the same as previous A === B - so just increment B.
				bIndex++;
			}
			else if (aLine === bLine) {
				// A and B are equal - so add to array and increment both.
				inBoth.push(bLine);
				previousMatch = bLine;
				aIndex++;
				bIndex++;
			}
			else {
				// Increment based on whichever of A and B is "lower" (closer to A).
				// That way, we can sort out any duplicates.
				var bIsHigher = bLine.localeCompare(aLine) === 1;
				if (bIsHigher) {
					onlyInA.push(aLine);
					aIndex++;
				}
				else {
					onlyInB.push(bLine);
					bIndex++;
				}
			}
		}
		// If we got to the end but there is still some left, it must all be for one "only" array.
		if (aIndex < a.length)
			onlyInA = onlyInA.concat(a.slice(aIndex));
		else if (bIndex < b.length)
			onlyInB = onlyInB.concat(b.slice(bIndex));

		return {
			onlyInA: onlyInA,
			onlyInB: onlyInB,
			inBoth: inBoth,
		}
	}

	// The main function for responding to changes.
	function updateAandB() {
		// Get the text for both textareas.
		var newTextA = a.textarea.el.value;
		var newTextB = compare.textarea.el.value;
		if (newTextA === a.textarea.el.text && newTextB === compare.textarea.el.text) {
			console.log("unchanged");
			return;
		}

		// Get initial data.
		a.textarea.text = newTextA;
		a.textarea.lines = splitAndFilter(newTextA);
		compare.textarea.text = newTextB;
		compare.textarea.lines = splitAndFilter(newTextB);

		// Update descriptions.
		a.desc.innerHTML = a.textarea.lines.length + " items";
		compare.desc.innerHTML = compare.textarea.lines.length + " items";

		// Find the duplicates in the A list.
		var aLinesSorted = a.textarea.lines.slice().sort(function (a, b) {
			return a.localeCompare(b);
		});
		var aDuplicates = findDuplicates(aLinesSorted);

		// Update the UI for the A buttons.
		updateUI(a.unique, aDuplicates.nondupes.concat(aDuplicates.dupes));
		updateUI(a.dupes, aDuplicates.dupes);
		updateUI(a.stripped, aDuplicates.nondupes);

		// Compare A's sorted lines with B's sorted lines.
		var bLinesSorted = compare.textarea.lines.slice().sort(function (a, b) {
			return a.localeCompare(b);
		});

		// Find the comparison arrays for A and B.
		var venned = vennAB(aLinesSorted, bLinesSorted);

		// Update the UI for the B buttons.
		updateUI(compare.aNotB, venned.onlyInA);
		updateUI(compare.bNotA, venned.onlyInB);
		updateUI(compare.aAndB, venned.inBoth);

		// Log for debugging.
		console.log(venned);
	}

	// Use a timeout, so the value retrieval is reliable.
	function onUpdate() {
		setTimeout(updateAandB, 10);
	}

	// Update on paste or keyup. I'm probably missing a case...
	a.textarea.el.addEventListener("paste", onUpdate);
	a.textarea.el.addEventListener("keyup", onUpdate);
	compare.textarea.el.addEventListener("paste", onUpdate);
	compare.textarea.el.addEventListener("keyup", onUpdate);

	updateAandB();
}

// On load....
(function (callback) {
	if (document.readyState === "complete" || (document.readyState !== "loading" && !document.documentElement.doScroll)) run();
	else document.addEventListener("DOMContentLoaded", run);
})(run);