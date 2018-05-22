/* Module Description */
/* locks items in a blueprint course */

/* Put dependencies here */
const canvas = require('canvas-wrapper'),
    asyncLib = require('async');

module.exports = (course, stepCallback) => {
    /* regex of item titles we don't want to lock */
    const unlockedNames = [/notes\s*from\s*instructor*/i];

    /* only run if the current course is a blueprint course & locking by obj type is enabled 
     Both of these properties are set in course-make-blueprint */
    if (!course.info.isBlueprint || !course.info.lockingEnabled) {
        course.message('Determined this course is not a blueprint OR locking items is disabled');
        stepCallback(null, course);
        return;
    }

    /***********************************************************
     * Loop through each item in the given array & call lockItem
     * API endpoint doesn't change based off item type,
     * just the request params 
     ***********************************************************/
    function loopItems(items, itemType, cb) {
        /* Lock a single item */
        function lockItem(item, itemCb) {
            var putObj = {
                'content_type': itemType.type,
                'content_id': item.id,
                'restricted': true
            };

            canvas.put(`/api/v1/courses/${course.info.canvasOU}/blueprint_templates/default/restrict_item`, putObj, (itemErr) => {
                if (itemErr)
                    course.error(new Error(`Unable to lock ${item.name} Err: ${itemErr.message}`));
                else
                    course.log('Specific Items Locked', { 'Item Name': item.name, 'Item Type': itemType.type });

                itemCb(null);
            });
        }

        asyncLib.eachLimit(items, 5, lockItem, () => {
            cb(null);
        });
    }

    /********************************************************
     * GETS PARAMS FOR PUT REQUEST (item ID & item type)
     * GET's all items of a provided type. Filters out 
     * items we don't want to lock by name. Saves the name &
     * ID of each remaining item.
     ********************************************************/
    function generatePUTParams(itemType, cb) {
        itemType.getter(course.info.canvasOU, (err, items) => {
            if (err) {
                /* move on to next item type if err */
                course.error(new Error(`Failed to get ${itemType.type}(s) ${err.message}`));
                cb();
                return;
            }

            /* filter out items we don't want to lock (by name). Only keep name and ID of each item */
            var filteredItems = items.reduce((accum, item) => {
                /* Only keep item if it passes all tests */
                var toKeep = unlockedNames.every(regex => {
                    return !(regex.test(item[itemType.name]) || item.restricted_by_master_course === true);
                });

                /* Item name is saved for reporting purposes */
                if (toKeep) accum.push({ name: item[itemType.name], id: item[itemType.id] });

                return accum;
            }, []);

            loopItems(filteredItems, itemType, cb);
        });
    }

    /**************
     * START HERE *
     *************/

    /* objects to lock. allows generatePUTParams to handle any type of object */
    var toLock = [{
        type: 'assignment',
        getter: canvas.getAssignments,
        name: 'name',
        id: 'id'
    },
    {
        type: 'attachment',
        getter: canvas.getFiles,
        name: 'display_name',
        id: 'id'
    },
    {
        type: 'discussion_topic',
        getter: canvas.getDiscussions,
        name: 'title',
        id: 'id'
    },
    {
        type: 'quiz',
        getter: canvas.getQuizzes,
        name: 'title',
        id: 'id'
    },
    {
        type: 'wiki_page',
        getter: canvas.getPages,
        name: 'title',
        id: 'page_id'
    }
    ];

    /* Loop through each item type and lock all instances of each type */
    asyncLib.eachSeries(toLock, generatePUTParams, (err) => {
        if (err) {
            course.error(err);
            stepCallback(null, err);
        }
        course.message('locked everything');
        stepCallback(null, course);
    });
};