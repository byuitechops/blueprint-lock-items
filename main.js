/*eslint-env node, es6*/

/* Module Description */
/* locks items of blueprint courses */

/* Put dependencies here */
const canvas = require('canvas-wrapper'),
    asyncLib = require('async');

module.exports = (course, stepCallback) => {
    course.addModuleReport('blueprint-lock-items');

    /* only run if the current course is a blueprint course & locking by obj type is enabled */
    if (!course.info.isBlueprint || !course.info.lockByObj) {
        course.success('blueprint-lock-items', 'Determined this course is not a blueprint');
        stepCallback(null, course);
        return;
    }

    function lockItems(items, itemType, cb) {
        asyncLib.eachLimit(items, 5, (item, itemCb) => {
            canvas.put(`/api/v1/courses/${course.info.canvasOU}/blueprint_templates/default/restrict_item`, {
                    'content_type': itemType.type,
                    'content_id': item.id,
                    'restricted': true
                },
                (itemErr, res) => {
                    if (itemErr)
                        course.throwErr('blueprint-lock-items', `${item.name} failed to lock. Err:${err}`);
                    else
                        course.success('blueprint-lock-items', `Locked ${itemType.type}: ${item.name}`);
                    itemCb(null);
                });
        }, () => {
            cb(null);
        });
    }

    /********************************************************
     * Setup uses the itemType object to get all instances
     * of the given object type. it filters  out instances
     * whos name matches an item in the unlockedNames array
     ********************************************************/
    function setup(itemType, cb) {
        itemType.getter(course.info.canvasOU, (err, items) => {
            if (err) {
                /* move on to next item type if err */
                course.throwErr('blueprint-lock-items', `Failed to get ${itemType.type}(s) ${err}`);
                cb();
                return;
            }
            var keep;
            var filteredItems = items.filter((item) => {
                keep = true;
                unlockedNames.forEach((regex) => {
                    if (regex.test(item[itemType.name]) || item.restricted_by_master_course == true)
                        keep = false;
                });
                return keep;
            }).map((item) => {
                return {
                    name: item[itemType.name],
                    id: item[itemType.id]
                }
            });
            // console.log(JSON.stringify(filteredItems, null, 2));
            // console.log('starting to lock items');
            lockItems(filteredItems, itemType, cb);
        });
    }
    /**************
     * START HERE *
     *************/

    /* regex of item titles we don't want to lock */
    var unlockedNames = [/notes\s*from\s*instructor*/i];
    /* objects to lock. allows setup to handle any type of object */
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

    asyncLib.eachSeries(toLock, setup, (err) => {
        if (err) {
            course.throwErr('blueprint-lock-items', err);
            stepCallback(null, err);
        }
        // course.success('blueprint-lock-items', 'locked everything');
        stepCallback(null, course);
    });
};