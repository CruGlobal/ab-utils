module.exports = {
   base: {
      table_name: "testTable",
      attributes: {
         string: "string",
         json: "json",
         datetime: "datetime",
         obj1: { type: "string" },
         col: { type: "string", column_name: "columnName" },
         attr: { type: "string", attr_name: "attr_name" }
      }
   },
   baseNoAdds: {
      attributes: {
         createdAt: false,
         updatedAt: false
      }
   }
};
