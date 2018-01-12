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
        asyncLib.eachLimit(items, (item, itemCb) => {

            canvas.put(`/api/v1/courses/${course.info.canvasOU}/blueprint_templates/default/restrict_item`, {
                    'content_type': itemType.type,
                    'content_id': item.id,
                    'restricted': true
                },
                (err, res) => {
                    if (err) {
                        itemCb(err);
                        return;
                    }
                    itemCb(null);
                });
        }, (err) => {
            if (err) {
                cb(err);
                return;
            }
            cb(null);
        });
    }

    function setup(itemType, cb) {
        itemType.getter(course.info.canvasOU, (err, items) => {
            if (err) {
                // do we really want to do this here?
                cb(err);
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

            lockItems(filteredItems, itemType, cb);
        });
    }


    var unlockedNames = [/notes\s*from\s*instructor*/i];
    var toLock = [{
        type: 'assignment',
        getter: canvas.getAssignments,
        name: 'name',
        id: 'id'
    }];

    /* get all assignments */
    asyncLib.eachSeries(toLock, setup, (err) => {
        if (err) {
            course.throwErr('blueprint-lock-items', err);
            stepCallback(null, err);
        }
        console.log('done');
        stepCallback(null, course);
    });
};