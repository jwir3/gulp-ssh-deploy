import gulp from 'gulp';
import test from 'test/index';
import gulpSequence from 'gulp-sequence';

test()

gulp.task('default', gulpSequence('test'))
