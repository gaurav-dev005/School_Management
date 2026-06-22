import Class from "./models/class.model.js";
import Section from "./models/section.model.js";

const normalizeClassName = (value) => {
  if (!value) return value;

  if (typeof value === "object" && value._id) {
    return value._id;
  }

  return String(value).trim();
};

const normalizeSectionName = (value) => {
  if (!value) return value;

  if (typeof value === "object" && value._id) {
    return value._id;
  }

  return String(value).trim().toUpperCase();
};

export const resolveClassAndSection = async (
  classValue,
  sectionValue,
  session = null
) => {
  if (!classValue) {
    throw new Error("Class is required");
  }

  if (!sectionValue) {
    throw new Error("Section is required");
  }

  // If frontend already sends populated/direct ObjectIds
  if (
    typeof classValue === "object" &&
    classValue._id &&
    typeof sectionValue === "object" &&
    sectionValue._id
  ) {
    return {
      classId: classValue._id,
      sectionId: sectionValue._id
    };
  }

  const className = normalizeClassName(classValue);
  const sectionName = normalizeSectionName(sectionValue);

  let classDoc = await Class.findOne({ name: className }).session(session);

  if (!classDoc) {
    const createdClass = await Class.create(
      [{ name: className }],
      { session }
    );

    classDoc = createdClass[0];
  }

  let sectionDoc = await Section.findOne({
    name: sectionName,
    classId: classDoc._id
  }).session(session);

  if (!sectionDoc) {
    const createdSection = await Section.create(
      [
        {
          name: sectionName,
          classId: classDoc._id
        }
      ],
      { session }
    );

    sectionDoc = createdSection[0];
  }

  return {
    classId: classDoc._id,
    sectionId: sectionDoc._id
  };
};