// Run: node prisma/migrate-status.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Migrating isActive → status for existing content...');

  // Courses: isActive=true → PUBLISHED, isActive=false → DRAFT
  const courses = await prisma.course.findMany();
  for (const c of courses) {
    if (c.isActive === true) {
      await prisma.course.update({ where: { id: c.id }, data: { status: 'PUBLISHED' } });
    } else {
      await prisma.course.update({ where: { id: c.id }, data: { status: 'ARCHIVED' } });
    }
  }
  console.log(`  Courses: ${courses.length} migrated`);

  // Units: same logic
  const units = await prisma.unit.findMany();
  for (const u of units) {
    if (u.isActive === true) {
      await prisma.unit.update({ where: { id: u.id }, data: { status: 'PUBLISHED' } });
    } else {
      await prisma.unit.update({ where: { id: u.id }, data: { status: 'ARCHIVED' } });
    }
  }
  console.log(`  Units: ${units.length} migrated`);

  // Lessons: same logic
  const lessons = await prisma.lesson.findMany();
  for (const l of lessons) {
    if (l.isActive === true) {
      await prisma.lesson.update({ where: { id: l.id }, data: { status: 'PUBLISHED' } });
    } else {
      await prisma.lesson.update({ where: { id: l.id }, data: { status: 'ARCHIVED' } });
    }
  }
  console.log(`  Lessons: ${lessons.length} migrated`);

  console.log('Migration complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
