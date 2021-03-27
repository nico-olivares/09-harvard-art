//Global variables ***********************************************************************
const BASE_URL = 'https://api.harvardartmuseums.org';
const KEY = process.env.API_KEY; // USE YOUR KEY HERE

//Bootstrap

prefetchCategoryLists();

//Functions ******************************************************************************

/**
 * Fetches and returns (the promise) any given url
 * @param {String} url
 */
async function fetchUrl(url) {
	onFetchStart();
	try {
		const data = await fetch(url);
		const response = await data.json();
		return response;
	} catch (error) {
		console.error(error.message);
	} finally {
		onFetchEnd();
	}
}

/**
 * Initial fetch of objects
 */
async function fetchObjects() {
	const url = `${BASE_URL}/object?${KEY}`;
	return await fetchUrl(url);
}

/**
 * Pre fetch of list of centuries to populate drop down menu
 */
async function fetchAllCenturies() {
	const url = `${BASE_URL}/century?${KEY}&size=100&sort=temporalorder`;

	if (localStorage.getItem('centuries')) {
		return JSON.parse(localStorage.getItem('centuries'));
	} else {
		const { records } = await fetchUrl(url);
		localStorage.setItem('centuries', JSON.stringify(records));
		return records;
	}
}

/**
 * Pre fetch of list of classifications to populate drop down menu
 */
async function fetchAllClassifications() {
	const url = `${BASE_URL}/classification?${KEY}&size=100&sort=name`;

	if (localStorage.getItem('classifications')) {
		return JSON.parse(localStorage.getItem('classifications'));
	} else {
		const { records } = await fetchUrl(url);
		localStorage.setItem('classifications', JSON.stringify(records));
		return records;
	}
}

/**
 * Handles the resolved fetch of centuries and classifications and appends them to the drop down menues
 */
async function prefetchCategoryLists() {
	try {
		const [classifications, centuries] = await Promise.all([
			fetchAllClassifications(),
			fetchAllCenturies(),
		]);
		// This provides a clue to the user, that there are items in the dropdown
		$('.classification-count').text(`(${classifications.length})`);

		classifications.forEach((classification) => {
			// append a correctly formatted option tag into
			// the element with id select-classification
			$('#select-classification')
				.append(`<option value="${classification.name}">${classification.name}</option>
  `);
		});

		// This provides a clue to the user, that there are items in the dropdown
		$('.century-count').text(`(${centuries.length})`);

		centuries.forEach((century) => {
			// append a correctly formatted option tag into
			// the element with id select-century
			$('#select-century')
				.append(`<option value="${century.name}">${century.name}</option>
  `);
		});
	} catch (error) {
		console.error(error.message);
	}
}

/**
 * Builds a url string using the base url, and any keyword search, classification, and century selected.
 * It also builds a query string that reflects what the query was.
 */
function buildSearchString() {
	const keyWord = $('#keywords').val();
	const classification = $('#select-classification').val();
	const century = $('#select-century').val();
	const url = encodeURI(
		`${BASE_URL}/object?${KEY}&classification=${classification}&century=${century}&keyword=${keyWord}`,
	);

	let query = '';
	keyWord ? (query = query + keyWord) : '';
	query && classification != 'any'
		? (query = query + ' & ' + classification)
		: classification != 'any'
		? (query = query + classification)
		: '';
	query && century != 'any'
		? (query = query + ' & ' + century)
		: century != 'any'
		? (query = query + century)
		: '';

	return [url, query];
}

/**
 * Adds a touch of style to the page. When a fetch is initiated it reveals a "downloading" message.
 */
function onFetchStart() {
	$('#loading').addClass('active');
}

/**
 * It disables the "downloading" message when the fetch is resolved.
 */
function onFetchEnd() {
	$('#loading').removeClass('active');
}

/**
 * Returns an html element to render one record. For the aside section.
 * @param {Object} record
 */
function renderPreview(record) {
	const { description, primaryimageurl, title, objectnumber } = record;
	const objectNumber = `(${objectnumber})`;

	const htmlTemplate = $(`
    <div class="object-preview">
      <a href="#">
        <img src="${primaryimageurl ? primaryimageurl : ''}" />
        <h3>${
					title === null
						? objectNumber
						: title === 'Untitled'
						? title + ' ' + objectNumber
						: title
				}</h3>
        <h3>${description === null ? '' : description}</h3>
      </a>
    </div>
    `);

	htmlTemplate.data('record', record);

	return htmlTemplate;
}

/**
 * updates the left side preview of all the records
 * @param {Array} records
 */
function updatePreview(data) {
	const root = $('#preview');
	$('.results').empty();
	const { info, records } = data;

	/*
    if info.next is present:
      - on the .next button set data with key url equal to info.next
      - also update the disabled attribute to false
    else
      - set the data url to null
      - update the disabled attribute to true


    Do the same for info.prev, with the .previous button
  */
	if (info.next) {
		$('.next').data('url', info.next).removeAttr('disabled');
	} else {
		$('.next').data('url', null).attr('disabled', 'true');
	}

	if (info.prev) {
		$('.previous').data('url', info.prev).removeAttr('disabled');
	} else {
		$('.previous').data('url', null).attr('disabled', 'true');
	}

	records.forEach(function (item) {
		$('.results').append(renderPreview(item));
	});
}

/**
 * Returns an html element of the whole record for preview purposes (right side)
 * @param {Object} record
 */
function renderFeature(record) {
	/**
	 * We need to read, from record, the following:
	 * HEADER: title, dated
	 * FACTS: description, *culture, style, *technique, *medium, dimensions, *people(array), department, division, contact, creditline
	 * PHOTOS: images(array), primaryimageurl
	 */

	const {
		title,
		dated,
		description,
		culture,
		style,
		technique,
		medium,
		dimensions,
		people,
		department,
		division,
		contact,
		creditline,
		images,
		primaryimageurl,
	} = record;

	const header = [
		['Title', title],
		['Dated', dated],
	];
	const facts = [
		['Description', description],
		['Culture', culture],
		['Style', style],
		['Technique', technique],
		['Medium', medium],
		['Dimensions', dimensions],
		['Person', people],
		['Department', department],
		['Division', division],
		['Contact', contact],
		['Credit', creditline],
	];
	const photos = images;

	// build and return template
	const htmlElement = $(`
  <div class="object-feature">
  <header>
    <h3>${header[0]}</h3>
    <h4>${header[1]}</h4>
  </header>
  <section class="facts">
    <!--
    <span class="title">Fact Name</span>
    <span class="content">Fact Content</span>
    And so on.. 
    -->
  </section>
  <section class="photos">
    <!--
    <img src="image url" />
    And so on.. 
    -->
  </section>
</div>
  `);

	renderFacts(facts);
	renderImages(photos);

	return htmlElement;

	/**
	 * Will render one fact at a time
	 * @param {Array} facts
	 */
	function renderFacts(facts) {
		facts.forEach(function ([name, value]) {
			if (name === 'Person') {
				personFact(name, value);
			} else if (name === 'Contact') {
				contactFact(name, value);
			} else if (
				name === 'Culture' ||
				name === 'Technique' ||
				name === 'Medium'
			) {
				searchableFact(name, value);
			} else {
				simpleFact(name, value);
			}
		});
	}

	/**
	 * Will append a simple fact
	 * @param {String} name
	 * @param {String} value
	 */
	function simpleFact(name, value) {
		if (value) {
			htmlElement.find('.facts').append(
				$(`
      <div class='fact'>
      <span class="title">${name}</span>
        <span class="content">${value}</span>
        </div>
      `),
			);
		}
	}

	/**
	 * Will append one or more people
	 * @param {String} name
	 * @param {Array} value
	 */
	function personFact(name, value) {
		if (value) {
			value.map(function (person) {
				const personHtml = $(
					`
            <div class='fact'>
              <span class="title">${name}</span>
              <span class="content"><a href='${searchURL(
								name,
								person.displayname,
							)}'>${person.displayname}</a></span>
              </div>
        `,
				);
				personHtml.data('query', [name, person.displayname]);
				htmlElement.find('.facts').append(personHtml);
			});
		}
	}

	/**
	 * Will append an email
	 * @param {String} name
	 * @param {String} value
	 */
	function contactFact(name, value) {
		if (value) {
			htmlElement.find('.facts').append(
				$(
					`
              <div class='fact'>
            <span class="title">${name}</span>
            <span class="content"><a target="_blank" href='mailto:${value}'>${value}</a></span>
            </div>
            `,
				),
			);
		}
	}

	/**
	 * Will append a searchable fact
	 * @param {String} name
	 * @param {String} value
	 */
	function searchableFact(name, value) {
		if (value) {
			const searchHtml = $(`
          <div class='fact'>
              <span class="title">${name}</span>
              <span class="content"><a href='${searchURL(
								name,
								value,
							)}'>${value}</a></span>
              </div>
              `);
			searchHtml.data('query', [name, value]);
			htmlElement.find('.facts').append(searchHtml);
		}
	}

	/**
	 * Appends one or more images if there's any image present
	 * @param {Array} images
	 */
	function renderImages(images) {
		if (images) {
			for (let i = 0; i < images.length; i++) {
				htmlElement.find('.photos').append(
					$(
						`
        <img src="${images[i].baseimageurl}" />
        `,
					),
				);
			}
		}
	}
}

/**
 *Returns a search url
 * @param {String} searchType
 * @param {String} searchString
 */
function searchURL(searchType, searchString) {
	return encodeURI(
		`${BASE_URL}/object?${KEY}&${searchType.toLowerCase()}=${searchString}`,
	);
}

//Listeners *************************************************************************

//Listen to the form submission
$('#search').on('submit', async function (event) {
	// prevent the default
	event.preventDefault();
	const [url, query] = buildSearchString();
	const result = await fetchUrl(url);
	updatePreview(result);
	$('.query').text(query);
	$('#keywords').val('');
});

//Listen to the next, previous page buttons
$('#preview .next, #preview .previous').on('click', async function () {
	/*
      read off url from the target 
      fetch the url
      read the records and info from the response.json()
      update the preview
    */
	const url = $(this).data('url');
	const result = await fetchUrl(url);
	updatePreview(result);
});

//Handles the click of a record card which will trigger a more thorough preview.
$('#preview').on('click', '.object-preview', function (event) {
	event.preventDefault(); // they're anchor tags, so don't follow the link
	// find the '.object-preview' element by using .closest() from the target
	// recover the record from the element using the .data('record') we attached
	// log out the record object to see the shape of the data
	const element = $(this).closest('.object-preview');
	const data = element.data('record');
	$('#feature').empty();
	$('#feature').append(renderFeature(data));
});

//Handles the click of a searchable term within the featured (detailed) view and generates a new search.
$('#feature').on('click', '.content a', async function (event) {
	if ($(this).attr('href').startsWith('mailto')) {
		return;
	}
	event.preventDefault();
	const url = $(this).attr('href');
	const result = await fetchUrl(url);

	const [name, value] = $(this).closest('.fact').data('query');
	$('.query').text(name + ' & ' + value);
	updatePreview(result);
});
