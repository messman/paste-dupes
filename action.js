function run() {

	function copyTextToClipboard(text) {
		if (!navigator.clipboard) {
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

	function createData(id, doButton) {
		var el = document.getElementById(id);
		var data = {
			el: document.getElementById(id),
			text: "",
			lines: []
		}
		if (doButton) {
			var button = el.querySelector("[data-js-copy]");
			button.addEventListener("click", function () {
				copyTextToClipboard(data.text);
			});
		}
		return data;
	}
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

	function splitAndFilter(text) {
		var lines = text.split("\n");
		return lines.filter(function (a) {
			return !!a;
		});
	}

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
				aIndex++;
			}
			else if (bLine === previousMatch) {
				bIndex++;
			}
			else if (aLine === bLine) {
				inBoth.push(bLine);
				previousMatch = bLine;
				aIndex++;
				bIndex++;
			}
			else {
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

	function updateAandB() {
		// Get the text for both textareas
		var newTextA = a.textarea.el.value;
		var newTextB = compare.textarea.el.value;
		if (newTextA === a.textarea.el.text && newTextB === compare.textarea.el.text) {
			console.log("unchanged");
			return;
		}

		// Get initial data
		a.textarea.text = newTextA;
		a.textarea.lines = splitAndFilter(newTextA);
		compare.textarea.text = newTextB;
		compare.textarea.lines = splitAndFilter(newTextB);

		// Update descriptions
		a.desc.innerHTML = a.textarea.lines.length + " items";
		compare.desc.innerHTML = compare.textarea.lines.length + " items";

		// Find the duplicates in the A list
		var aLinesSorted = a.textarea.lines.slice().sort(function (a, b) {
			return a.localeCompare(b);
		});
		var aDuplicates = findDuplicates(aLinesSorted);

		// Update the UI for the A buttons
		updateUI(a.unique, aDuplicates.nondupes.concat(aDuplicates.dupes));
		updateUI(a.dupes, aDuplicates.dupes);
		updateUI(a.stripped, aDuplicates.nondupes);

		// Compare A's sorted lines with B's sorted lines
		var bLinesSorted = compare.textarea.lines.slice().sort(function (a, b) {
			return a.localeCompare(b);
		});

		var venned = vennAB(aLinesSorted, bLinesSorted);
		updateUI(compare.aNotB, venned.onlyInA);
		updateUI(compare.bNotA, venned.onlyInB);
		updateUI(compare.aAndB, venned.inBoth);
		console.log(venned);
	}

	function onUpdate() {
		setTimeout(updateAandB, 10);
	}

	a.textarea.el.addEventListener("paste", onUpdate);
	a.textarea.el.addEventListener("keyup", onUpdate);
	compare.textarea.el.addEventListener("paste", onUpdate);
	compare.textarea.el.addEventListener("keyup", onUpdate);

	updateAandB();
}
(function (callback) {
	if (document.readyState === "complete" || (document.readyState !== "loading" && !document.documentElement.doScroll)) run();
	else document.addEventListener("DOMContentLoaded", run);
})(run);