# Dockerfile

FROM ruby:3.3

ENV APP_ENV=production
WORKDIR /app
COPY . /app
RUN bundle install

EXPOSE 4567

CMD ["ruby", "app.rb"]