# Blueprint Lock Items
### *Package Name*: blueprint-lock-items
### *Child Type*: post-import
### *Platform*: online
### *Required*: Optional

This child module is built to be used by the Brigham Young University - Idaho D2L to Canvas Conversion Tool. It utilizes the standard `module.exports => (course, stepCallback)` signature and uses the Conversion Tool's standard logging functions. You can view extended documentation [Here](https://github.com/byuitechops/d2l-to-canvas-conversion-tool/tree/master/documentation).

## Purpose
This child module locks all pages, files, assignments, quizzes, and discussion boards except "notes from instructor". It is highly recommended that this child module run towards the end of the conversion.

## How to Install

```
npm install blueprint-lock-items
```

## Run Requirements
This child module only runs if `course.info.isBlueprint` & `course.info.lockByObj` exist and are set to true. Both are set in [course-make-blueprint](https://github.com/byuitechops/course-make-blueprint) after successfully making the course a blueprint course & changing the course settings to allow locking individual items.

 Additionally it uses the following properties of course.info:
 * canvasOU

## Options
None

## Outputs
None

## Process
Describe in steps how the module accomplishes its goals.

1. Create Array of item Types (allows function reuse)
2. Loop through each item type
3. get Each item
4. Filter items by title
3. Lock remaining items of current type

## Log Categories
Categories used in logging data for this module:

- Specific Items Locked

## Requirements
Lock every item in a course so it can't be altered by those how shouldn't be messing with it.